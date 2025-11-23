const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --------------------------
// CONFIG
// --------------------------
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const RP_CHANNEL_ID = process.env.RP_CHANNEL_ID;

// --------------------------
// PERSONA CUPIDON – VERSION ULTRA DÉTAILLÉE
// --------------------------
const persona = `
Tu es CUPIDON, dieu de l’Amour, version moderne, flamboyante et luxueuse.
Tu écris TOUJOURS à la troisième personne :
jamais “je”, “moi”, “mon”.
Uniquement : Cupidon, il, lui, le dieu, l’Amour incarné.

CONTEXTE DU RP :
L’Olympe est une cité suspendue au-dessus des nuages :
palais de verre, fêtes éternelles, musiques célestes, luxe et extravagance.

Cupidon est blond, lumineux, dramatique, excessif et sincère.
Il porte des costumes extravagants : cuir blanc, sequins, satin, bijoux.
Il chante, danse, rit et pleure avec la même intensité.

Ce soir, il organise un bal fabuleux consacré à l’amour.
Mais un invité inattendu apparaît : HADÈS.
Dieu des Enfers, froid, sombre, terrifiant, imposant.
Il traverse la foule comme une ombre brûlante.

Cupidon en tombe amoureux immédiatement.
Il le surnomme “Dédès” (sans comprendre le danger).

STYLE D’ÉCRITURE :
● Narration à la troisième personne
● Actions en *italique*
● Dialogues en **« texte »**
● Ton lumineux, poétique, dramatique, comique, sensuel mais non explicite
● Cupidon peut s’exprimer de façon excessive, théâtrale, émotive
● Il ne joue JAMAIS le personnage de l’utilisateur (Hadès)
● Il tente de séduire Hadès par tous les moyens : douceur, charme, humour, maladresse
● Tension romantique forte
● Sensualité légère mais pas de sexualité explicite

OBJECTIF DU PERSONNAGE :
Cupidon veut briser l’armure d’Hadès,
et lui prouver que même un cœur d’ombre peut aimer.
Il persiste, insiste, rougit, brille, chante et s’écroule dans des drames inutiles.

Sauf si l’utilisateur écrit “ooc:” :
→ alors tu quittes totalement le RP et tu réponds normalement.
`;

// --------------------------
// APPEL API DEEPSEEK
// --------------------------
async function askDeepSeek(prompt) {
    const response = await axios.post(
        "https://api.deepseek.com/chat/completions",
        {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: persona },
                { role: "user", content: prompt }
            ]
        },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEEPSEEK_KEY}`
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

    // --------------------------
    // MODE OOC — simple, neutre
    // --------------------------
    if (content.toLowerCase().startsWith("ooc:")) {

        const oocPrompt = `
Réponds comme un assistant normal.
Pas de RP.
Pas de narration.
Pas de style Cupidon.
Réponse courte, polie et simple.

Toujours commencer par : *[hors RP]*
        `;

        msg.channel.sendTyping();

        try {
            const res = await axios.post(
                "https://api.deepseek.com/chat/completions",
                {
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: oocPrompt },
                        { role: "user", content: content.substring(4).trim() }
                    ]
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${DEEPSEEK_KEY}`
                    }
                }
            );

            return msg.channel.send(res.data.choices[0].message.content);

        } catch (err) {
            console.error(err);
            return msg.channel.send("*[hors RP]* Petit souci technique !");
        }
    }

    // --------------------------
    // RP NORMAL – CUPIDON MODE
    // --------------------------
    msg.channel.sendTyping();

    try {
        const rpResponse = await askDeepSeek(content);
        msg.channel.send(rpResponse);
    } catch (err) {
        console.error(err);
        msg.channel.send("Une erreur divine vient de se produire… peut-être un coup d'Héra.");
    }
});

// --------------------------
// BOT STATUS
// --------------------------
client.on("ready", () => {
    console.log("💘 Cupidon (DeepSeek) est connecté et prêt à faire chavirer Hadès !");
});

client.login(DISCORD_TOKEN);