
const LEGAL_FROM_REPLACEMENTS = [
    [/spółka z ograniczoną odpowiedzialnością/gi, "Sp. z o.o."],
    [/spółka akcyjna/gi, "S.A."],
    [/spółka komandytowa/gi, "Sp. k."],
];

const toTitleCase = (str) =>
    str
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const formatCompanyName = (name) => {
    if (!name) return name;
    let formatted = toTitleCase(name);
    LEGAL_FROM_REPLACEMENTS.forEach(([pattern, replecment]) => {
        formatted = formatted.replace(pattern, replecment);
    });
    return formatted;
};

const parseAddress = (raw) => {
    if (!raw) {
        return { street: "", suite: "", city: "", postcode: "" };
    }

    const [streetPart, cityPart] = raw.split(",").map((part) => part.trim());

    const cityMatch = cityPart?.match(/^(\d{2}-\d{3})\s+(.+)$/);
    const postcode = cityMatch?.[1] ?? "";
    const city = cityMatch?.[2] ?? cityPart ?? "";

    const numberMatch = streetPart?.match(/^(.*?)\s+(\d[\w/-]*)$/);
    const street = numberMatch ? numberMatch[1] : streetPart ?? "";
    const suite = numberMatch ? numberMatch[2] : "";

    return {
        street: toTitleCase(street),
        suite,
        city: toTitleCase(city),
        postcode,
    };
};

module.exports = {
    parseAddress,
    formatCompanyName,
    lookup: async (req, res) => {
        const nip = (req.params.nip || "").replace(/\D/g, "");

        if (nip.length !== 10) {
            return res.status(400).json({
                message: "NIP musi składać się z 10 cyfr."
            });
        }

        const today = new Date().toISOString().slice(0, 10);

        let response;
        try {
            response = await fetch(
                `https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${today}`
            );
        } catch (err) {
            return res.status(502).json({
                message: "Nie udało się połączyć z rejestrem VAT."
            });
        }

        if (!response.ok) {
            if (response.status === 400) {
                return res.status(400).json({
                    message: "Nieprawidłowy numer NIP."
                });
            }
            return res.status(502).json({
                message: "Rejestr VAT jest obecnie niedostępny."
            });
        }

        let data;
        try {
            data = await response.json();
        } catch (err) {
            return res.status(502).json({ message: "Nieprawidłowa odpowiedź rejestru VAT." });
        }

        const subject = data?.result?.subject;
        if (!subject) {
            return res.status(404).json({
                message: "Nie znaleziono firmy o podanym NIP."
            });
        }

        const address = parseAddress(subject.workingAddress || subject.residenceAddress);

        res.status(200).json({
            name: formatCompanyName(subject.name),
            address
        });
    },
}