import type { ContentPackage } from '../../content/ingestion'
export function Resources({
  pkg,
  onChange,
}: {
  pkg: ContentPackage
  onChange: (pkg: ContentPackage) => void
}) {
  return (
    <details>
      <summary>Passages, audio, exhibits and licensed media</summary>
      {pkg.bank.passages.map((p, i) => (
        <section key={i} className="studio-resource">
          <h3>{p.id}</h3>
          <label className="form-label">
            Passage title
            <input
              value={p.title}
              onChange={(e) =>
                onChange({
                  ...pkg,
                  bank: {
                    ...pkg.bank,
                    passages: pkg.bank.passages.map((v, j) =>
                      j === i ? { ...v, title: e.target.value } : v,
                    ),
                  },
                })
              }
            />
          </label>
          <label className="form-label">
            Passage text
            <textarea
              lang="en"
              rows={10}
              value={p.text}
              onChange={(e) =>
                onChange({
                  ...pkg,
                  bank: {
                    ...pkg.bank,
                    passages: pkg.bank.passages.map((v, j) =>
                      j === i ? { ...v, text: e.target.value } : v,
                    ),
                  },
                })
              }
            />
          </label>
        </section>
      ))}
      {pkg.bank.stimuli.map((s, i) => (
        <section key={i} className="studio-resource">
          <h3>
            {s.id} · {s.kind}
          </h3>
          <label className="form-label">
            Stimulus title
            <input
              value={s.title}
              onChange={(e) =>
                onChange({
                  ...pkg,
                  bank: {
                    ...pkg.bank,
                    stimuli: pkg.bank.stimuli.map((v, j) =>
                      j === i ? { ...v, title: e.target.value } : v,
                    ),
                  },
                })
              }
            />
          </label>
          {'audio' in s && (
            <>
              <label className="form-label">
                Transcript ({s.audio.kind})
                <textarea
                  lang="en"
                  rows={7}
                  value={s.audio.transcript}
                  onChange={(e) =>
                    onChange({
                      ...pkg,
                      bank: {
                        ...pkg.bank,
                        stimuli: pkg.bank.stimuli.map((v, j) =>
                          j === i && 'audio' in v
                            ? { ...v, audio: { ...v.audio, transcript: e.target.value } }
                            : v,
                        ),
                      },
                    })
                  }
                />
              </label>
              {s.audio.kind === 'recording' && (
                <label className="form-label">
                  Local recording path
                  <input
                    value={s.audio.src}
                    onChange={(e) =>
                      onChange({
                        ...pkg,
                        bank: {
                          ...pkg.bank,
                          stimuli: pkg.bank.stimuli.map((v, j) =>
                            j === i && 'audio' in v && v.audio.kind === 'recording'
                              ? { ...v, audio: { ...v.audio, src: e.target.value } }
                              : v,
                          ),
                        },
                      })
                    }
                  />
                </label>
              )}
            </>
          )}
        </section>
      ))}
      <p className="small muted">
        Edit IDs, passage associations, photographs, exhibits, audio kind/credit, provenance and
        license manifests in the complete JSON panel. Add actual files under public/media and
        declare their rights; this interface does not download remote media.
      </p>
    </details>
  )
}
