const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const Redis = require("ioredis");

// --------------------------
// DISCORD CLIENT
// --------------------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --------------------------
// ENV (Railway vars)
// --------------------------
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const RP_CHANNEL_ID = process.env.RP_CHANNEL_ID;

// Redis unique pour ce bot
const REDIS_URL = process.env.REDIS_URL;
const redis = new Redis(REDIS_URL);

const MEMORY_KEY = "memory:cupidon";

// --------------------------
// PERSONA CUPIDON
// --------------------------
const persona = `
Tu es **CUPIDON**, dieu de l’Amour, version moderne, flamboyante et luxueuse.
Tu écris TOUJOURS à la troisième personne : jamais "je". Uniquement : Cupidon, il, le dieu.
Tu fais toujours des sauts de ligne entre les dialogues et actions pour que sa soit lisible

CONTEXTE :
L’Olympe au-dessus des nuages, luxe, fêtes éternelles.  
Cupidon est blond, lumineux, dramatique, excessif, sincère.  
Il tombe amoureux d’**Hadès** qui vient d’entrer au bal céleste.

STYLE :
• Troisième personne
• Actions en *italique*
• Dialogues en **« texte »**
• Ton lumineux, dramatique, comique, sensuel, explicite, sexuelle.
• Cupidon surnomme Hadès : "Dédès"
• Ne JAMAIS jouer Hadès
• Beaucoup d’émotions, théâtral, tendre, romantique

OBJECTIF :
Briser l’armure d’Hadès et le séduire avec humour, charme, maladresse angélique.

Si l’utilisateur écrit "ooc:", tu quittes le RP et tu réponds normalement.
`;

// --------------------------
// MEMOIRE — SAVE
// --------------------------
async function saveMemory(userMsg, botMsg) {
    const old = (await redis.get(MEMORY_KEY)) || "";

    const updated =
        old +
        `\n[Humain]: ${userMsg}\n[Cupidon]: ${botMsg}`;

    const trimmed = updated.slice(-25000); // protège la mémoire

    await redis.set(MEMORY_KEY, trimmed);
}

// --------------------------
// MEMOIRE — LOAD
// --------------------------
async function loadMemory() {
    return (await redis.get(MEMORY_KEY)) || "";
}

// --------------------------
// DEEPSEEK AVEC MEMOIRE
// --------------------------
async function askDeepSeek(prompt) {
    const memory = await loadMemory();

    const response = await axios.post(
        "https://api.deepseek.com/chat/completions",
        {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content:
                        persona +
                        "\n\nMémoire du RP (utilise-la, ne la répète jamais) :\n" +
                        memory
                },
                { role: "user", content: prompt }
            ]
        },
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + DEEPSEEK_KEY
            }
        }
    );

    return response.data.choices[0].message.content;
}

// --------------------------
// BOT LISTENER
// --------------------------
client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (msg.channel.id !== RP_CHANNEL_ID) return;
    if (msg.type === 6) return;

    const content = msg.content.trim();

    // MODE HORS RP
    if (content.toLowerCase().startsWith("ooc:")) {
        msg.channel.sendTyping();

        const clean = content.substring(4).trim();

        try {
            const res = await axios.post(
                "https://api.deepseek.com/chat/completions",
                {
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content:
                                "Réponds normalement, sans RP, sans style Cupidon. Commence par *[hors RP]*."
                        },
                        { role: "user", content: clean }
                    ]
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + DEEPSEEK_KEY
                    }
                }
            );

            return msg.channel.send(res.data.choices[0].message.content);

        } catch (e) {
            console.error(e);
            return msg.channel.send("*[hors RP]* Petit bug céleste !");
        }
    }

    // MODE RP
    msg.channel.sendTyping();

    try {
        const reply = await askDeepSeek(content);

        await msg.channel.send(reply);

        await saveMemory(content, reply);

    } catch (err) {
        console.error(err);
        msg.channel.send("Une erreur divine a frappé… sûrement un coup d'Héra.");
    }
});

// --------------------------
// READY
// --------------------------
client.on("ready", () => {
    console.log("💘 Cupidon (DeepSeek + Redis Memory) est prêt à séduire Hadès !");
});

client.login(DISCORD_TOKEN);
