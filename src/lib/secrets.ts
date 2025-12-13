import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();

export async function getSecret(name: string): Promise<string | undefined> {
    // Only attempt to fetch from Secret Manager in production or if explicitly requested
    // In local development, we often prefer .env files. 
    // However, the request is to "reference it in code via Google Secret Manager".

    // We check process.env first for overrides or local dev
    if (process.env[name]) {
        return process.env[name];
    }

    try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || "beatbrain-ai";
        const [version] = await client.accessSecretVersion({
            name: `projects/${projectId}/secrets/${name}/versions/latest`,
        });

        const payload = version.payload?.data?.toString();
        return payload;
    } catch (error) {
        console.warn(`Failed to access secret ${name} from Secret Manager:`, error);
        return undefined;
    }
}
