export interface EmailExplorerOptions {
	auth?: {
		enabled?: boolean;
		registerEnabled?: boolean;
	};
	accountRecovery?: {
		fromEmail: string;
	};
}

export interface Session {
	id: string;
	userId: string;
	email: string;
	isAdmin: boolean;
	expiresAt: number;
}

export interface User {
	id: string;
	email: string;
	isAdmin: boolean;
	createdAt: number;
	updatedAt: number;
}

export type Env = {
	MAILBOX: DurableObjectNamespace<import("./durableObject/index").MailboxDO>;
	BUCKET: R2Bucket;
	SEND_EMAIL: SendEmail;
	config?: EmailExplorerOptions;
	// 邮件转发配置（可选）
	FORWARD_EMAILS?: string; // 用逗号分隔的邮箱列表
	// Telegram 通知配置（可选）
	TG_TOKEN?: string;
	TG_CHAT_ID?: string;
};
