import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  onLogin: () => void;
}

export default function DiscordLoginPrompt({ onLogin }: Props) {
  const { t } = useTranslation();

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>{t("discord.title")}</h1>
      <p style={{ marginBottom: "20px", color: "#aaa" }}>
        {t("discord.login.description")}
        <br />
        <span style={{ fontSize: "12px", color: "#888" }}>{t("discord.login.note")}</span>
      </p>
      <button
        onClick={onLogin}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(74, 158, 255, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
        style={{
          transition: "all 0.3s ease",
        }}
      >
        {t("discord.login.button")}
      </button>
    </div>
  );
}


