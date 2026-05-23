export const BLOG_IMAGE_FALLBACK_PATH = "/blog-images/blog-fallback-image.jpg";

const BLOG_IMAGE_PATH_BY_SLUG = Object.freeze({
    "10-semne-care-ne-ajuta-sa-recunoastem-boala-cronica-de-rinichi-smart-medical":
        "/blog-images/rinichi_original_tratament_230_155.jpg",
    "200-de-afectiuni-ale-plamanului-au-simptome-similare-dar-cauze-diferite-sa-intelegem-bolile-interstitiale-pulmonare":
        "/blog-images/inflamatie_plamani_respiratie_230_155.jpg",
    "afectiuni-ale-ochiului-care-sunt-cele-mai-comune-dr-max-farmacia":
        "/blog-images/Older-woman-receiving-an-eye-exam_004.avif",
    "afectiunile-creierului-ce-boli-pot-afecta-creierul":
        "/blog-images/Afectiuni-neurologice-2-scaled-1-2048x1303.jpg",
    "afectiunile-ficatului-diagnostic-si-tratament-sanador":
        "/blog-images/Afectiunile-ficatului-SANADOR-cover.jpg",
    "afectiunile-neurologice-tipuri-cauze-si-tratamente-kinomed":
        "/blog-images/tipuri-de-afectiuni-neurologice.webp",
    "afectiunile-ochiului-cauze-simptome-si-tratament-medlife":
        "/blog-images/afectiunile-ochiului-1.webp",
    "afectiuni-neurologice-frecvente-ce-trebuie-sa-stim-clinica-medo":
        "/blog-images/afectiuni-neurologice-frecvente-1.webp",
    "afectiuni-oculare-frecvente-si-simptomele-acestora-acuvue":
        "/blog-images/afectiunile-ochiului-2.webp",
    "afectiuni-oftalmologice-clinica-dr-munteanu":
        "/blog-images/Older-woman-receiving-an-eye-exam_004.avif",
    "afectiuni-pneumologice-cele-mai-grave-boli-de-plaman-enayati":
        "/blog-images/embolism-pulmonar.png",
    "boli-ale-plamanilor-si-respiratorii": "/blog-images/durere-plamani-1.png",
    "boli-cardiovasculare-tipuri-cauze-simptome-dr-max":
        "/blog-images/boli-cardiovasculare-1.webp",
    "boli-de-ficat-cauze-simptome-si-preventie":
        "/blog-images/ciroza-preview.webp",
    "boli-de-inima-semne-si-simptome": "/blog-images/boli-inima.jpg",
    "bolile-cardiovasculare-categorii-diagnostic-tratament-preventie-reginamaria":
        "/blog-images/boli-cardiovasculare-2.webp",
    "bolile-cardiovasculare-tipuri-cauze-diagnostic-tratament-si-preventie-medlife":
        "/blog-images/boli-inima-3.webp",
    "bolile-de-ficat-care-sunt-semnele-de-avertizare":
        "/blog-images/bolile-de-ficat-care-sunt-semnele-de-avertizare-desktop.jpg",
    "bolile-de-rinichi-diagnostic-tratament-si-preventie-sanador":
        "/blog-images/Bolile-rinichiului-SANADOR.jpg",
    "bolile-oculare-anomalii-si-simptome-pentru-pacienti-eyelaser":
        "/blog-images/afectiunile-ochiului-2.webp",
    "bolile-pulmonare-simptome-diagnostic-si-tratament-sanador":
        "/blog-images/durere-plamani-2.png",
    "bolile-renale-de-rinichi": "/blog-images/boli-renale.webp",
    "bolile-renale-policlinica-analize-incredere":
        "/blog-images/Laborator-3.jpg",
    "cancer-de-col-uterin-simptome-diagnostic-si-tratament-sanador":
        "/blog-images/cancer-col-uterin-investigatii.jpg",
    "cancer-de-san-mamar-simptome-tratament-prevenire-reginamaria":
        "/blog-images/cancer-mamar-1.webp",
    "cancer-mamar-cauze-simptome-diagnosticare-tratament-medlife":
        "/blog-images/cancer-mamar-2.jpg",
    "cancerul-de-ce-se-imbolnavesc-oamenii-de-cancer":
        "/blog-images/cancer-cells.jpg",
    "cancerul-simptome-si-semnale-de-alarma-medlife":
        "/blog-images/centru-oncologic.jpg",
    "ce-este-cancerul-de-ce-apare-si-cum-se-trateaza":
        "/blog-images/cancer-mamar-3.webp",
    "cele-5-simptome-care-iti-arata-ca-ai-probleme-cu-ficatul":
        "/blog-images/ciroza-preview.webp",
    "cele-mai-frecvente-10-afectiuni-neurologice-enayati":
        "/blog-images/alzheimer.webp",
    "ce-medicamente-sa-nu-ti-administrezi-singur-covid-19":
        "/blog-images/medicamente-covid.jpg",
    coronavirus: "/blog-images/vaccin-sars.jpg",
    "covid-19-comunitatea-sfatulmedicului": "/blog-images/mituri-min.jpg",
    "creierul-uman-ce-trebuie-sa-stii-despre-el-boli-asociate":
        "/blog-images/Care-este-diferenta-intre-un-neurolog-si-un-neurochirurg--15.jpg",
    "de-ce-apare-durerea-de-plamani-reginamaria":
        "/blog-images/durere-plamani-3.png",
    "durerea-de-rinichi-cauze-simptome-tratament-preventie-reginamaria":
        "/blog-images/durere-rinichi-1.jpg",
    "ekg-sau-ecg-ce-este-si-cum-se-interpreteaza-reginamaria":
        "/blog-images/ekg.png",
    "electrocardiograma-ecg-ekg-monza-ares": "/blog-images/ekg-2.webp",
    "ficat-cu-probleme-cauze-afectiuni-asociate-recomandari-medlife":
        "/blog-images/Afectiunile-ficatului-SANADOR-cover.jpg",
    "ficatul-gras-steatoza-hepatica-bioclinica":
        "/blog-images/ciroza-preview.webp",
});

export function getBlogImagePathForSlug(slug) {
    const value = BLOG_IMAGE_PATH_BY_SLUG[slug];

    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();

    if (!trimmed || !trimmed.startsWith("/blog-images/")) {
        return null;
    }

    return trimmed;
}
