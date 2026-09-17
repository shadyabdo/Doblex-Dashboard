import { useStore } from "../store";
import { I, type IconName } from "../icons";
import { Overline, Reveal, Ticks } from "../components/ui";
import { STATUS_LABEL, STATUS_STYLE, formatDate, type ProjectLink, type View } from "../types";

export default function ProjectDetail({ id, go }: { id: string; go: (v: View) => void }) {
  const { db, deleteProject, toggleGoal } = useStore();
  const project = db.projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <I n="alert" className="mx-auto h-16 w-16 text-coral" />
          <h2 className="mt-4 font-display text-2xl font-extrabold text-ink-900">
            المشروع غير موجود
          </h2>
          <p className="mt-2 text-ink-500">ربما تم حذفه أو لم يعد موجودًا</p>
          <button
            onClick={() => go({ name: "projects" })}
            className="btn-press mt-6 rounded-xl bg-brand px-6 py-3 font-display font-bold text-card hover:bg-brand-deep"
          >
            العودة للمشاريع
          </button>
        </div>
      </div>
    );
  }

  const field = db.fields.find((f) => f.id === project.fieldId);
  const statusStyle = STATUS_STYLE[project.status];
  const doneGoals = project.goals.filter((g) => g.done).length;
  const totalGoals = project.goals.length;
  const progressPct = totalGoals > 0 ? Math.round((doneGoals / totalGoals) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-3 sm:space-y-4 lg:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <Reveal>
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-ink-950 p-3 sm:p-5 lg:p-8">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 50%, ${field?.color || "#0E6E55"}40 0%, transparent 50%),
                  radial-gradient(circle at 80% 50%, #E19B1040 0%, transparent 50%)
                `,
              }}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => go({ name: "projects" })}
              className="btn-press mb-2 sm:mb-3 lg:mb-4 flex items-center gap-1.5 sm:gap-2 rounded-lg border border-ink-700 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs lg:text-sm text-ink-300 hover:border-ink-500 hover:text-card"
            >
              <I n="arrow" className="h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-180" />
              العودة للمشاريع
            </button>

            <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4">
              <div className="flex-1">
                <div className="mb-1.5 sm:mb-2 lg:mb-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span
                    className="rounded-full px-2 sm:px-2.5 lg:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] lg:text-xs font-bold"
                    style={{ background: statusStyle.bg, color: statusStyle.fg }}
                  >
                    {STATUS_LABEL[project.status]}
                  </span>
                  {field && (
                    <span
                      className="flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-2.5 lg:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] lg:text-xs font-bold"
                      style={{ background: field.soft, color: field.color }}
                    >
                      <I n={field.icon as IconName} className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {field.name}
                    </span>
                  )}
                </div>

                <h1 className="font-display text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-card leading-tight">
                  {project.title}
                </h1>
                {project.subtitle && (
                  <p className="mt-1 sm:mt-1.5 lg:mt-2 text-xs sm:text-sm lg:text-base text-ink-300">{project.subtitle}</p>
                )}

                <div className="mt-2 sm:mt-3 lg:mt-4 flex flex-wrap gap-2 sm:gap-3 lg:gap-4 text-[11px] sm:text-xs lg:text-sm text-ink-400">
                  {project.client && (
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      <I n="briefcase" className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                      {project.client}
                    </span>
                  )}
                  {project.year && (
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      <I n="calendar" className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                      {project.year}
                    </span>
                  )}
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <I n="clock" className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                    {formatDate(project.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Progress */}
      {totalGoals > 0 && (
        <Reveal delay={100}>
          <div className="rounded-xl border border-line bg-card p-3 sm:p-4 lg:p-6">
            <Overline>التقدم في الأهداف</Overline>
            <div className="mt-2 sm:mt-3 lg:mt-4 flex items-center gap-2 sm:gap-3 lg:gap-4">
              <div className="flex-1 min-w-0">
                <div className="mb-1.5 sm:mb-2 flex justify-between text-[11px] sm:text-xs lg:text-sm">
                  <span className="font-bold text-ink-700 truncate">
                    {doneGoals} / {totalGoals} أهداف محققة
                  </span>
                  <span className="font-mono font-bold text-brand ms-2">{progressPct}%</span>
                </div>
                <div className="h-2 sm:h-2.5 lg:h-3 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-brand-deep transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Video */}
      {project.videoUrl && (
        <Reveal delay={120}>
          <div className="rounded-xl border border-line bg-card p-3 sm:p-4 lg:p-6">
            <div className="mb-2 sm:mb-3 lg:mb-4 flex flex-wrap items-center justify-between gap-2">
              <Overline>فيديو المشروع</Overline>
              <a
                href={project.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-press flex items-center gap-1 sm:gap-1.5 rounded-lg border border-ink-200 px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-bold text-ink-500 transition-colors hover:border-coral hover:text-coral"
              >
                <I n="link" className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                <span className="hidden sm:inline">فتح في المنصة ↗</span>
                <span className="sm:hidden">↗</span>
              </a>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-lg sm:rounded-xl border border-line bg-ink-950 shadow-[0_10px_30px_-15px_rgba(11,36,28,0.45)] sm:shadow-[0_20px_44px_-20px_rgba(11,36,28,0.45)]">
              <iframe
                src={project.videoUrl}
                title={`فيديو ${project.title}`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </Reveal>
      )}

      {/* Description */}
      {project.description && (
        <Reveal delay={150}>
          <div className="rounded-xl border border-line bg-card p-3 sm:p-4 lg:p-6">
            <Overline>الوصف</Overline>
            <p className="mt-2 sm:mt-3 lg:mt-4 whitespace-pre-wrap text-xs sm:text-sm lg:text-base text-ink-700 leading-relaxed">
              {project.description}
            </p>
          </div>
        </Reveal>
      )}

      {/* Details */}
      {project.details && (
        <Reveal delay={200}>
          <div className="rounded-xl border border-line bg-card p-3 sm:p-4 lg:p-6">
            <Overline>التفاصيل</Overline>
            <p className="mt-2 sm:mt-3 lg:mt-4 whitespace-pre-wrap text-xs sm:text-sm lg:text-base text-ink-700 leading-relaxed">
              {project.details}
            </p>
          </div>
        </Reveal>
      )}

      {/* Goals */}
      {project.goals.length > 0 && (
        <Reveal delay={250}>
          <div className="rounded-xl border border-line bg-card p-3 sm:p-4 lg:p-6">
            <Overline>الأهداف</Overline>
            <ul className="mt-2 sm:mt-3 lg:mt-4 space-y-1.5 sm:space-y-2 lg:space-y-3">
              {project.goals.map((goal) => (
                <li key={goal.id}>
                  <button
                    onClick={() => toggleGoal(project.id, goal.id)}
                    className="btn-press flex w-full items-start gap-2 sm:gap-3 rounded-lg border border-line p-2 sm:p-3 text-start hover:border-brand hover:bg-brand-soft/30"
                  >
                    <span
                      className={`flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        goal.done
                          ? "border-brand bg-brand text-card"
                          : "border-ink-300 bg-card text-transparent"
                      }`}
                    >
                      <I n="check" className="h-3 w-3 sm:h-4 sm:w-4" />
                    </span>
                    <span
                      className={`flex-1 text-xs sm:text-sm ${
                        goal.done ? "text-ink-400 line-through" : "text-ink-700"
                      }`}
                    >
                      {goal.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      )}

      {/* Achievements */}
      {project.achievements.length > 0 && (
        <Reveal delay={300}>
          <div className="rounded-xl border border-line bg-card p-3 sm:p-4 lg:p-6">
            <Overline>الإنجازات</Overline>
            <div className="mt-2 sm:mt-3 lg:mt-4 grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2">
              {project.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="rounded-lg border border-gold/30 bg-gold-soft/30 p-2.5 sm:p-3 lg:p-4"
                >
                  <div className="font-mono text-lg sm:text-xl lg:text-2xl font-extrabold text-gold-deep">
                    {achievement.metric}
                  </div>
                  <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs lg:text-sm text-ink-700">{achievement.text}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Images */}
      {project.images.length > 0 && (
        <Reveal delay={350}>
          <div className="rounded-xl border border-line bg-card p-3 sm:p-4 lg:p-6">
            <Overline>الصور ({project.images.length})</Overline>
            <div className="mt-2 sm:mt-3 lg:mt-4 grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
              {project.images.map((img, index) => (
                <a
                  key={img.id}
                  href={img.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-video overflow-hidden rounded-lg border border-line bg-ink-50"
                >
                  <img
                    src={img.src}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-ink-950/0 transition-colors group-hover:bg-ink-950/20">
                    <I n="eye" className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-card opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="absolute top-1.5 start-1.5 sm:top-2 sm:start-2 flex h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-ink-950/70 text-[9px] sm:text-[10px] lg:text-xs font-bold text-card backdrop-blur-sm">
                    {index + 1}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Links */}
      {project.links && project.links.length > 0 && (
        <Reveal delay={400}>
          <div className="rounded-xl border border-line bg-card p-3 sm:p-4 lg:p-6">
            <Overline>الروابط</Overline>
            <div className="mt-2 sm:mt-3 lg:mt-4 grid gap-1.5 sm:gap-2 lg:gap-3 grid-cols-1 sm:grid-cols-2">
              {project.links.map((link: ProjectLink) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-press flex items-center gap-2 sm:gap-3 rounded-lg border border-line p-2 sm:p-3 lg:p-4 hover:border-brand hover:bg-brand-soft/30"
                >
                  <span className="flex h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <I n={link.type === "demo" ? "globe" : link.type === "github" ? "github" : link.type === "figma" ? "figma" : "link"} className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-ink-800 truncate">{link.label}</div>
                    <div className="text-[10px] sm:text-xs text-ink-500 truncate">{link.url}</div>
                  </div>
                  <I n="arrow" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-ink-400 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Actions */}
      <Reveal delay={450}>
        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:flex-wrap">
          <button
            onClick={() => go({ name: "project-form", projectId: project.id })}
            className="btn-press flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-brand px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 font-display text-xs sm:text-sm font-bold text-card hover:bg-brand-deep sm:flex-1"
          >
            <I n="edit" className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            تعديل المشروع
          </button>
          <button
            onClick={async () => {
              if (window.confirm("هل أنت متأكد من حذف هذا المشروع؟")) {
                deleteProject(project.id);
                go({ name: "projects" });
              }
            }}
            className="btn-press flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border-2 border-coral/40 bg-coral-soft/30 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 font-display text-xs sm:text-sm font-bold text-coral hover:bg-coral hover:text-card sm:flex-1"
          >
            <I n="trash" className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            حذف المشروع
          </button>
        </div>
      </Reveal>
    </div>
  );
}
