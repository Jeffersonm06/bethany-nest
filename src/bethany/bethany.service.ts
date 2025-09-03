import { Injectable, NotFoundException } from '@nestjs/common';
import { GoogleGenAI, Part } from '@google/genai';
import { FirebaseService } from 'src/firebase/firebase.service';
import { UserService } from 'src/user/user.service';

export interface Message {
    sender: string;
    userId: string;
    content: string;
    image?: string;
    timestamp: number;
}

@Injectable()
export class Bethany {
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
    ) { }

    async sendMessage(text: string, userId: string): Promise<Message> {
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

        console.log(messageToSend);

        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: [{ text: messageToSend }], // string única dentro do array
            config: {
                thinkingConfig: { thinkingBudget: 1 },
                systemInstruction: this.instructions
            }
        });

        const timestamp = Date.now();

        // Mensagem do usuário
        const userMessage: Message = { sender: 'user', userId, content: text, timestamp };
        await this.saveMessage(userMessage);

        // Mensagem da Bethany
        let formatedResponse = this.formatarParaHtml(response.text || "...")
        const bethanyMessage: Message = { sender: 'bethany', userId, content: formatedResponse, timestamp: Date.now() };
        await this.saveMessage(bethanyMessage);

        return bethanyMessage;
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

    formatarParaHtml(texto: string): string {
        texto = texto.trim();

        // Converte negrito **texto** para <strong>texto</strong>
        texto = texto.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

        // Quebra as ideias numeradas em blocos separados
        texto = texto.replace(/(\d+\.)/g, "\n$1");

        // Quebra o texto em linhas
        const linhas = texto
            .split("\n")
            .map(linha => linha.trim())
            .filter(linha => linha.length > 0);

        const html: string[] = [];
        let listaAberta = false;

        for (const linha of linhas) {
            if (linha.startsWith("- ") || linha.startsWith("* ")) {
                // Se encontrar marcador, abre <ul> se ainda não abriu
                if (!listaAberta) {
                    html.push("<ul>");
                    listaAberta = true;
                }
                const item = linha.slice(2).trim();
                html.push(`<li>${item}</li>`);
            } else if (/^\d+\./.test(linha)) {
                // Se for item numerado, fecha lista anterior se aberta
                if (listaAberta) {
                    html.push("</ul>");
                    listaAberta = false;
                }
                const [numero, ...resto] = linha.split(".");
                html.push(`<h3>${numero}. ${resto.join(".").trim()}</h3>`);
            } else {
                // Texto normal, fecha lista se aberta e adiciona parágrafo
                if (listaAberta) {
                    html.push("</ul>");
                    listaAberta = false;
                }
                html.push(`<p>${linha}</p>`);
            }
        }

        // Fecha lista se tiver aberto no final
        if (listaAberta) {
            html.push("</ul>");
        }

        return html.join("\n");
    }

}
