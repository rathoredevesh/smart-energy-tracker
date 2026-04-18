export default function SectionHeading({ eyebrow, title, description, align = "left" }) {
  const alignment = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`mb-10 flex flex-col gap-4 ${alignment}`}>
      <span className="section-label">{eyebrow}</span>
      <div className="max-w-3xl space-y-4">
        <h2 className="section-title">{title}</h2>
        <p className="section-copy">{description}</p>
      </div>
    </div>
  );
}

