import { useState, type ReactNode } from 'react'
import type { Passage, Stimulus } from '../../content/schema'

/** Renders shared stimuli without knowing sessions, repositories or answer keys. */
export function StimulusView({
  stimulus,
  passages,
  exam = false,
  children,
  renderPassage,
}: {
  stimulus: Stimulus
  passages: Passage[]
  exam?: boolean
  children?: ReactNode
  renderPassage?: (passage: Passage) => ReactNode
}) {
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <article className="passage-panel shared-stimulus">
      <p className="eyebrow">
        {stimulus.kind === 'reading' && stimulus.passageIds.length > 1
          ? `${stimulus.passageIds.length} VĂN BẢN DÙNG CHUNG`
          : 'TƯ LIỆU DÙNG CHUNG'}
      </p>
      <h2>{exam && stimulus.part <= 4 ? `Listening · Part ${stimulus.part}` : stimulus.title}</h2>
      {stimulus.kind === 'photograph' &&
        (stimulus.photograph.status === 'ready' && !imageFailed ? (
          <figure className="practice-photo">
            <img
              src={stimulus.photograph.src}
              alt={
                exam
                  ? 'Photograph for this listening question. A visual description is available after submission.'
                  : stimulus.photograph.alt
              }
              onError={() => setImageFailed(true)}
            />
            <figcaption>
              Ảnh luyện tập · {stimulus.photograph.author} ·{' '}
              <a href={stimulus.photograph.sourceUrl} target="_blank" rel="noreferrer">
                Nguồn ảnh
              </a>{' '}
              ·{' '}
              <a href={stimulus.photograph.licenseUrl} target="_blank" rel="noreferrer">
                {stimulus.photograph.license}
              </a>
              <br />
              Không phải ảnh đề thi ETS.
            </figcaption>
          </figure>
        ) : (
          <div className="media-placeholder" role="alert">
            {stimulus.photograph.status === 'placeholder'
              ? stimulus.photograph.reason
              : 'Không tải được ảnh. Câu này không thể đánh giá đúng kỹ năng nhìn ảnh; bạn có thể tạm dừng và tải lại hoặc để trống khi thi.'}
          </div>
        ))}
      {children}
      {'exhibit' in stimulus && stimulus.exhibit && (
        <section className="exhibit" lang="en" data-learning={!exam || undefined}>
          {stimulus.exhibit.kind === 'table' ? (
            <div className="table-scroll">
              <table>
                <caption>{stimulus.exhibit.title}</caption>
                <thead>
                  <tr>
                    {stimulus.exhibit.columns.map((column) => (
                      <th scope="col" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stimulus.exhibit.rows.map((row, index) => (
                    <tr key={index}>
                      {row.map((cell, i) => (
                        <td key={i}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <figure>
              <img
                src={stimulus.exhibit.src}
                alt={stimulus.exhibit.alt}
                onError={() => setImageFailed(true)}
              />
              <figcaption>
                {stimulus.exhibit.title} · {stimulus.exhibit.credit}
              </figcaption>
              {imageFailed && <p role="alert">Không tải được biểu đồ.</p>}
            </figure>
          )}
        </section>
      )}
      {'passageIds' in stimulus &&
        stimulus.passageIds.map((id) => {
          const passage = passages.find((p) => p.id === id)
          return passage && !exam && renderPassage ? (
            <div key={id}>{renderPassage(passage)}</div>
          ) : passage ? (
            <section key={id} className="stimulus-document">
              <h3>{passage.title}</h3>
              <div className="passage-body" lang="en" data-learning={!exam || undefined}>
                {passage.text.split(/(\{\{\d+\}\})/g).map((text, i) =>
                  /^\{\{\d+\}\}$/.test(text) ? (
                    <mark className="blank-marker" key={i}>
                      [{text.slice(2, -2)}]
                    </mark>
                  ) : (
                    text
                  ),
                )}
              </div>
            </section>
          ) : (
            <p role="alert" key={id}>
              Văn bản chưa có sẵn. Tiến độ đã lưu vẫn được giữ.
            </p>
          )
        })}
      {!exam && (
        <p className="lookup-hint">
          Chọn từ/cụm tiếng Anh, rồi nhấn “Tra” hoặc Alt + Enter. Chỉ bôi đen sẽ không mở nghĩa.
        </p>
      )}
    </article>
  )
}
