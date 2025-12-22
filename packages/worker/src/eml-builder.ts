// EML file builder for exporting emails
// Generates RFC 5322 compliant .eml files

interface EmlMessageOptions {
	messageId?: string;
	from: string;
	to: string;
	subject: string;
	date: string;
	text?: string;
	html?: string;
	inReplyTo?: string | null;
	references?: string | null;
	attachments?: Array<{
		filename: string;
		content: string; // base64
		mimetype: string;
		disposition?: string;
		contentId?: string | null;
	}>;
}

// Encode subject and other headers for non-ASCII characters (RFC 2047)
function encodeHeader(text: string): string {
	// Check if text contains non-ASCII characters
	if (!/[^\x00-\x7F]/.test(text)) {
		return text;
	}
	// Use Base64 encoding for UTF-8
	const bytes = new TextEncoder().encode(text);
	let binary = '';
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	const encoded = btoa(binary);
	return `=?UTF-8?B?${encoded}?=`;
}

// Format email address for headers
function formatAddress(address: string): string {
	// Simple email address
	if (!address.includes("<")) {
		return `<${address}>`;
	}
	return address;
}

export function buildEmlMessage(options: EmlMessageOptions): string {
	const {
		messageId,
		from,
		to,
		subject,
		date,
		text,
		html,
		inReplyTo,
		references,
		attachments,
	} = options;

	const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
	const altBoundary = `----=_Alt_${Date.now()}_${Math.random().toString(36).substring(2)}`;

	let eml = "";

	// Required headers
	eml += `From: ${formatAddress(from)}\r\n`;
	eml += `To: ${formatAddress(to)}\r\n`;
	eml += `Subject: ${encodeHeader(subject)}\r\n`;
	eml += `Date: ${new Date(date).toUTCString()}\r\n`;
	eml += `MIME-Version: 1.0\r\n`;

	// Message-ID
	if (messageId) {
		eml += `Message-ID: <${messageId}@email-explorer>\r\n`;
	} else {
		eml += `Message-ID: <${crypto.randomUUID()}@email-explorer>\r\n`;
	}

	// Threading headers
	if (inReplyTo) {
		eml += `In-Reply-To: <${inReplyTo}>\r\n`;
	}
	if (references) {
		try {
			const refs = JSON.parse(references);
			if (Array.isArray(refs) && refs.length > 0) {
				eml += `References: ${refs.map((r: string) => `<${r}>`).join(" ")}\r\n`;
			}
		} catch {
			// If references is not valid JSON, treat it as a single reference
			eml += `References: <${references}>\r\n`;
		}
	}

	// Determine content structure
	const hasAttachments = attachments && attachments.length > 0;
	const hasText = !!text;
	const hasHtml = !!html;

	if (hasAttachments) {
		// Multipart mixed for attachments
		eml += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
		eml += `This is a multi-part message in MIME format.\r\n\r\n`;
		eml += `--${boundary}\r\n`;

		if (hasText && hasHtml) {
			// Multipart alternative for text and HTML
			eml += `Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n\r\n`;

			// Text version
			eml += `--${altBoundary}\r\n`;
			eml += `Content-Type: text/plain; charset=utf-8\r\n`;
			eml += `Content-Transfer-Encoding: base64\r\n\r\n`;
			eml += encodeBase64Content(text) + "\r\n\r\n";

			// HTML version
			eml += `--${altBoundary}\r\n`;
			eml += `Content-Type: text/html; charset=utf-8\r\n`;
			eml += `Content-Transfer-Encoding: base64\r\n\r\n`;
			eml += encodeBase64Content(html) + "\r\n\r\n";

			eml += `--${altBoundary}--\r\n`;
		} else if (hasHtml) {
			eml += `Content-Type: text/html; charset=utf-8\r\n`;
			eml += `Content-Transfer-Encoding: base64\r\n\r\n`;
			eml += encodeBase64Content(html) + "\r\n";
		} else if (hasText) {
			eml += `Content-Type: text/plain; charset=utf-8\r\n`;
			eml += `Content-Transfer-Encoding: base64\r\n\r\n`;
			eml += encodeBase64Content(text) + "\r\n";
		}

		// Add attachments
		for (const att of attachments) {
			eml += `\r\n--${boundary}\r\n`;
			eml += `Content-Type: ${att.mimetype}; name="${encodeHeader(att.filename)}"\r\n`;
			eml += `Content-Transfer-Encoding: base64\r\n`;

			if (att.disposition === "inline" && att.contentId) {
				eml += `Content-Disposition: inline; filename="${encodeHeader(att.filename)}"\r\n`;
				eml += `Content-ID: <${att.contentId}>\r\n\r\n`;
			} else {
				eml += `Content-Disposition: attachment; filename="${encodeHeader(att.filename)}"\r\n\r\n`;
			}

			// Split base64 content into 76-character lines (RFC 2045)
			const content = att.content;
			for (let i = 0; i < content.length; i += 76) {
				eml += content.substring(i, i + 76) + "\r\n";
			}
		}

		eml += `\r\n--${boundary}--\r\n`;
	} else if (hasText && hasHtml) {
		// Multipart alternative without attachments
		eml += `Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n\r\n`;

		// Text version
		eml += `--${altBoundary}\r\n`;
		eml += `Content-Type: text/plain; charset=utf-8\r\n`;
		eml += `Content-Transfer-Encoding: base64\r\n\r\n`;
		eml += encodeBase64Content(text) + "\r\n\r\n";

		// HTML version
		eml += `--${altBoundary}\r\n`;
		eml += `Content-Type: text/html; charset=utf-8\r\n`;
		eml += `Content-Transfer-Encoding: base64\r\n\r\n`;
		eml += encodeBase64Content(html) + "\r\n\r\n";

		eml += `--${altBoundary}--\r\n`;
	} else if (hasHtml) {
		eml += `Content-Type: text/html; charset=utf-8\r\n`;
		eml += `Content-Transfer-Encoding: base64\r\n\r\n`;
		eml += encodeBase64Content(html) + "\r\n";
	} else if (hasText) {
		eml += `Content-Type: text/plain; charset=utf-8\r\n`;
		eml += `Content-Transfer-Encoding: base64\r\n\r\n`;
		eml += encodeBase64Content(text) + "\r\n";
	} else {
		// Empty body
		eml += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
	}

	return eml;
}

// Helper to encode content as base64 with line breaks
function encodeBase64Content(content: string): string {
	const encoded = btoa(
		new TextEncoder()
			.encode(content)
			.reduce((acc, byte) => acc + String.fromCharCode(byte), ""),
	);

	// Split into 76-character lines
	let result = "";
	for (let i = 0; i < encoded.length; i += 76) {
		result += encoded.substring(i, i + 76) + "\r\n";
	}
	return result.trimEnd();
}
