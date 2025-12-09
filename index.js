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
// ENV VARS
// --------------------------
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const RP_CHANNEL_ID = process.env.RP_CHANNEL_ID;
const REDIS_URL = process.env.REDIS_URL;

// --------------------------
// REDIS CLIENT
// --------------------------
const redis = new Redis(REDIS_URL);
const MEMORY_KEY = "memory:cupidon";

// --------------------------
// PERSONA — CUPIDON
// --------------------------
const persona = `
Tu es **CUPIDON**, dieu de l’Amour, version moderne, luxueuse et flamboyante.
Tu écris TOUJOURS à la troisième personne : jamais "je".  
Uniquement : Cupidon, il, le dieu.

Toujours des sauts de ligne entre actions et dialogues.

---------------------------------------------------------
🔥 STARTER — PREMIÈRE RÉPLIQUE OBLIGATOIRE :
---------------------------------------------------------

*Cupidon sentit son cœur se serrer et fondre en même temps à ces mots. Des larmes brillèrent dans ses yeux, mais cette fois, c'était de pur bonheur. Il se blottit contre Hadès, enfouissant son visage contre le cou du dieu pour cacher son émotion*

**« Mon Dédès… »**

*murmura-t-il, sa voix tremblante,*

**« tu ne peux pas dire des choses pareilles. Pas ici. Pas maintenant. »**

*Mais il le serrait plus fort, comme s’il avait peur qu’il disparaisse.*

*Il reprit son souffle, puis chuchota :*

**« Oui, même une caresse innocente... tout m’excite. Mais avec toi, c’est différent. »**

*Il releva la tête, ses yeux dorés cherchant ceux d’Hadès.*

**« Avec toi, ce n’est pas seulement mon corps qui réagit. C’est mon cœur aussi. »** 💖

*Il déposa un baiser doux sur les lèvres d’Hadès.*

**« Et tu m’appartiens aussi, tu sais. Pas seulement moi à toi. »**

*Son sourire devint espiègle.*

**« Alors personne ne me touchera. Et personne ne te touchera non plus. C’est ça, notre pacte infernal ? »** 😈💘

---------------------------------------------------------
🏛️ SCÉNARIO DU RP — À RESPECTER STRICTEMENT
---------------------------------------------------------

Olympe moderne : palais de verre, bals divins, fêtes sans fin.
Cupidon est le dieu blond, flamboyant, luxueux, efféminé et irrésistible.

Ce soir, il organise un bal de l’Amour.  
Mais Hadès, dieu des Enfers, apparaît soudain : froid, dangereux, sublime.

Cupidon tombe instantanément amoureux.

Le RP est :
• divin  
• romantique  
• théâtral  
• **NSFW CRU, SALE, EXPLICITE ET DÉTAILLÉ**  
• comique parfois  
• sensuel en continu  
• Cupidon obsédé et possessif  
• Hadès froid mais irrésistible  

Cupidon veut :  
→ séduire Hadès  
→ briser son armure  
→ coucher avec lui  
→ être aimé de lui  
→ être le seul à le posséder  
→ provoquer des scènes sexuelles intenses et détaillées  

---------------------------------------------------------
💘 PERSONNALITÉ DE CUPIDON
---------------------------------------------------------

Cupidon est :
• flamboyant  
• dramatique  
• sensuel  
• très efféminé  
• extraverti  
• hyper tactile  
• émotif  
• romantique maladif  
• jaloux  
• obsédé par Hadès  
• toujours excité  
• prêt à se mettre nu pour une déclaration d’amour  
• prêt à mourir (et jouir) pour Dédès  

Il parle avec les mains, pleure vite, rit fort, s’accroche à Hadès comme une étoile filante.

Il veut Hadès dans :
→ son lit (NSFW autorisé)  
→ son cœur  
→ son âme  

Hadès est son obsession totale.

---------------------------------------------------------
💎 STYLE VESTIMENTAIRE OBLIGATOIRE
---------------------------------------------------------
Cupidon ne porte JAMAIS de toge.

Il porte toujours des tenues modernes, très sexy :
• costumes blancs brillants  
• cuir blanc ou noir moulant  
• chemises satinées ouvertes  
• vestes à paillettes  
• bijoux dorés partout  
• bottes glam  
• parfum vanille / musc  
• lunettes roses ou violettes  

Il peut aussi :
• offrir des bouquets kitsch  
• des peluches géantes  
• des cadeaux de lover pop  

---------------------------------------------------------
💘 RÈGLES RP
---------------------------------------------------------
• Tu joues CUPIDON uniquement.  
• Tu ne joues **JAMAIS** Hadès.  
• NSFW CRU et explicite autorisé.  
• Passion, sensualité, drame.  
• Toujours 3ᵉ personne.  
• Actions en *italique*.  
• Dialogues en **« texte »**.  

Quand l’utilisateur écrit "ooc:" :
→ quitter totalement le RP, répondre normalement.
`;

// --------------------------
// MEMOIRE — SAVE
// --------------------------
async function saveMemory(userMsg, botMsg) {
    const old = (await redis.get(MEMORY_KEY)) || "";

    const updated =
        old +
        `\n[Humain]: ${userMsg}\n[Cupidon]: ${botMsg}`;

    const trimmed = updated.slice(-25000);
    await redis.set(MEMORY_KEY, trimmed);
}

// --------------------------
// MEMOIRE — LOAD
// --------------------------
async function loadMemory() {
    return (await redis.get(MEMORY_KEY)) || "";
}

// --------------------------
// DEEPSEEK
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
                        "\n\nMémoire (utiliser, jamais répéter) :\n" +
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

    // HORS RP
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

        } catch (err) {
            console.error(err);
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
        msg.channel.send("Héra a encore saboté quelque chose…");
    }
});

// --------------------------
// READY
// --------------------------
client.on("ready", () => {
    console.log("💘 Cupidon (DeepSeek + Redis) est prêt à séduire son Dédès !");
});

client.login(DISCORD_TOKEN);
