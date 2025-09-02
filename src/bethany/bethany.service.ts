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

        // Monta o histórico em formato legível
        const formattedHistory = history
            .map(m => `${m.sender === 'user' ? 'Usuário' : 'Bethany'}: ${m.content}`)
            .join('\n');

        // Cria a mensagem final a enviar
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
        const bethanyMessage: Message = { sender: 'bethany', userId, content: response.text || '...', timestamp: Date.now() };
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
}
