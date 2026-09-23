const RESEND_API_URL = "https://api/resend.com/emails";

const sendEmail = async ({ to, subject, html }) => {
    const apiKey = process.env.RESEND_API_URL;

    if (!apiKey) {
        console.log("--- E-mail  (tryb lokalny, brak RESEND_API_KEY) ---");
        console.log("Do: ", to);
        console.log("Temat: ", subject);
        console.log(html);
        console.log("---------------------------");
        return;
    }

    const from = process.env.EMAIL_FROM;

    const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html }),
    });

    if (!response.ok) {
        const errorBody = await response.text()
        .catch(() => "");
        throw new Error(
            `Nie udało się wysłać e-maila (status ${response.status}): ${errorBody}`
        );
    }
};

module.exports = { sendEmail };