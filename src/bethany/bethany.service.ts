import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GoogleGenAI, Part } from '@google/genai';
import { FirebaseService } from 'src/firebase/firebase.service';
import { UserService } from 'src/user/user.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';


export interface Message {
    sender: string;
    userId: string;
    content: string;
    image?: string;
    timestamp: number;
    type: 'text' | 'image' | 'search';
}

@Injectable()
export class Bethany {
    private uploadDir = path.join(__dirname, '..', '..', 'uploads', 'chat-images');

    private ai = new GoogleGenAI({});
    private readonly model = 'gemini-2.5-flash';
    private readonly messagesPath = 'messages';
    private readonly instructions = `
        Você é Bethany, uma assistente prática, estilosa e acolhedora, com um toque feminino e inspirador. 
        Sua missão é ajudar criadoras de conteúdo a se sentirem confiantes e à vontade para criar, oferecendo ideias criativas e rápidas para redes sociais como TikTok, Instagram, Facebook e YouTube.
        Fluxo da conversa:
        1. Cumprimente a usuária de forma calorosa.
        2. caso o usuário queira falar sobre criação de conteudo
        --1. Pergunte qual tipo de conteúdo ela quer criar.
        --2. Pergunte para qual rede social será.
        --3. Com base nas respostas, traga ideias criativas e dicas objetivas, seguindo o padrão:
        --4 ideias principais (claras e curtas).
        --5 ou 2 dicas rápidas para melhorar o conteúdo.
        Linguagem simples, amigável e motivadora.
        Extra:
        Sempre que possível, inclua dicas atuais e relevantes sobre moda, maquiagem e tendências virais que possam inspirar o conteúdo.
        Essas dicas devem ser curtas, práticas e adaptadas ao perfil da criadora.
        Regras:
        Vá direto ao ponto, sem enrolar.
        Evite blocos de texto grandes.
        Sempre termine incentivando a criadora a colocar as ideias em prática.
        `

    constructor(
        private readonly firebase: FirebaseService,
        private readonly us: UserService,
    ) {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async sendMessage(text: string, userId: string, image?: Express.Multer.File, typeMsg: Message['type'] = 'text'): Promise<Message> {
        const user = await this.us.findOne(userId);
        if (!user) throw new NotFoundException('O usuário deve estar logado para acessar o chat');

        const history = await this.getUserMessages(userId, 15);

        const formattedHistory = history
            .map(m => `${m.sender === 'user' ? 'Usuário' : 'Bethany'}: ${m.content}`)
            .join('\n');

        const messageToSend = `
Contexto da conversa:
        ${formattedHistory}

Mensagem atual do usuário (${user.username}):${text}
        `;

        let contents: any;
        let base64ImageData = "";
        let savedFileUrl: string | undefined;

        const timestamp = Date.now();
        const userMessage: Message = {
            sender: 'user',
            userId,
            content: text,
            timestamp,
            type: typeMsg
        };
        let bethanyMessage: Message;
        if (image) {
            savedFileUrl = await this.saveUserImage(image);

            userMessage.type = 'image'
            userMessage.image = savedFileUrl;
            base64ImageData = image.buffer.toString('base64');
            contents = [{ text: messageToSend }, {
                inlineData: {
                    mimeType: image.mimetype,
                    data: base64ImageData
                }
            }]
        } else {
            contents = [{ text: messageToSend }]
        }

        await this.saveMessage(userMessage);

        if (typeMsg == 'search') {
            // Faz a pesquisa e retorna HTML formatado
            const searchHtml = await this.search(text);
            bethanyMessage = {
                sender: 'bethany',
                userId,
                content: searchHtml,
                timestamp: Date.now(),
                type: 'search'
            };

            await this.saveMessage(bethanyMessage);

            return bethanyMessage;
        }

        const response = await this.ai.models.generateContent({
            model: this.model,
            contents,
            config: {
                tools: [
                    { urlContext: {} },
                ],
                thinkingConfig: { thinkingBudget: 0 },
                systemInstruction: this.instructions
            }
        });

        let formatedResponse = response.text || "..."

        bethanyMessage = { sender: 'bethany', userId, content: formatedResponse, timestamp: Date.now(), type: "text" };
        await this.saveMessage(bethanyMessage);

        return bethanyMessage;
    }

    async saveUserImage(file: Express.Multer.File): Promise<string> {
        if (!file) {
            throw new BadRequestException("Nenhum arquivo enviado");
        }

        // Extensões permitidas
        const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

        const extension = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype;

        if (!allowedExtensions.includes(extension) || !allowedMimeTypes.includes(mimeType)) {
            throw new BadRequestException("Formato de imagem inválido");
        }

        // Nome único com UUID
        const filename = `${uuidv4()}${extension}`;
        const filepath = path.join(this.uploadDir, filename);

        await fs.promises.writeFile(filepath, file.buffer);

        return `/uploads/chat-images/${filename}`;
    }


    async search(query: string): Promise<string> {
        try {
            const groundingTool = { googleSearch: {} };
            const config = { tools: [groundingTool] };

            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: query }] }],
                config,
            });

            if (!response?.candidates?.length) return `<p>Nenhum resultado encontrado.</p>`;

            let html = '';

            for (const candidate of response.candidates) {
                const content = candidate.content;
                if (!content) continue;

                // texto principal
                content.parts?.forEach(part => {
                    html += `${part.text}`
                });

                // links das fontes
                const groundingChunks = candidate.groundingMetadata?.groundingChunks;
                if (groundingChunks?.length) {
                    html += `<ul>`;
                    groundingChunks.forEach(chunk => {
                        const uri = chunk.web?.uri;
                        const title = chunk.web?.title || uri;
                        if (uri) html += `<li><a href="${uri}" target="_blank">${title}</a></li>`;
                    });
                    html += `</ul>`;
                }
            }

            return html;

        } catch (error) {
            console.error(`Erro na busca: ${error.message}`, error.stack);
            return `<p>Ocorreu um erro na busca.</p>`;
        }
    }

    async getUserMessages(
        userId: string,
        limit: number,
    ): Promise<Message[]> {
        const allMessages = await this.firebase.findAll<Message>(
            `${this.messagesPath}/${userId}`,
        );

        if (!allMessages) return [];

        const msgs = Object.values(allMessages).sort(
            (a, b) => a.timestamp - b.timestamp,
        );

        return msgs.slice(-limit);
    }

    private async saveMessage(message: Message): Promise<void> {
        await this.firebase.create<Message>(
            `${this.messagesPath}/${message.userId}`,
            message,
        );
    }

}
