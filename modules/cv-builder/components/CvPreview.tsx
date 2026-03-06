'use client';

import { useRef, useEffect, useState, CSSProperties } from 'react';
import { CvData } from '../types';

interface Props {
  cvData: CvData;
}

const CV_WIDTH = 794;

const formatDate = (date: string) => {
  if (!date) return '';
  const [year, month] = date.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return month ? `${months[parseInt(month) - 1]} ${year}` : year;
};

function CvDocument({ cvData }: { cvData: CvData }) {
  const { design, personal, experience, education, skills, languages, projects } = cvData;
  const { primaryColor, font, template } = design;

  const isModern = template === 'modern';
  const isClassic = template === 'classic';
  const isMinimal = template === 'minimal';

  const headingColor = isMinimal ? '#1a1a1a' : primaryColor;

  const sectionTitle: CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: headingColor,
    marginBottom: 4,
    marginTop: 16,
  };

  const divider: CSSProperties = {
    border: 'none',
    borderTop: `${isClassic ? 2 : 1}px solid ${isMinimal ? '#ddd' : primaryColor}`,
    margin: '4px 0 10px',
  };

  const contactLine = [
    personal.email,
    personal.phone,
    [personal.city, personal.state, personal.country].filter(Boolean).join(', '),
    personal.website,
  ].filter(Boolean);

  return (
    <div
      id="cv-preview-content"
      style={{
        width: CV_WIDTH,
        minHeight: 1123,
        background: 'white',
        padding: '48px 56px',
        fontFamily: font,
        fontSize: 12,
        color: '#222',
        lineHeight: 1.5,
      }}
    >
      {/* ─── Header ─── */}
      <div style={{ marginBottom: 6 }}>
        <div
          style={{
            fontSize: isClassic ? 26 : 30,
            fontWeight: isMinimal ? 600 : 800,
            color: isMinimal ? '#1a1a1a' : primaryColor,
            letterSpacing: isModern ? '-0.02em' : 0,
            lineHeight: 1.1,
            marginBottom: 4,
          }}
        >
          {personal.name || 'Họ và tên'}
        </div>
        {personal.title && (
          <div style={{ fontSize: 14, color: '#666', marginBottom: 5, fontWeight: isClassic ? 600 : 400 }}>
            {personal.title}
          </div>
        )}
        {contactLine.length > 0 && (
          <div style={{ fontSize: 11, color: '#555' }}>{contactLine.join('  |  ')}</div>
        )}
        {personal.profiles.length > 0 && (
          <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
            {personal.profiles.map((p, i) => (
              <span key={p.id}>
                {i > 0 && '  |  '}
                {p.network}: {p.url}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─── Summary ─── */}
      {personal.summary && (
        <>
          <div style={sectionTitle}>Summary</div>
          <hr style={divider} />
          <p style={{ fontSize: 12, color: '#444', margin: '0 0 4px' }}>{personal.summary}</p>
        </>
      )}

      {/* ─── Experience ─── */}
      {experience.length > 0 && (
        <>
          <div style={sectionTitle}>Work Experience</div>
          <hr style={divider} />
          {experience.map((exp) => (
            <div key={exp.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: 12.5 }}>{exp.position || '—'}</strong>
                <span style={{ fontSize: 11, color: '#666', whiteSpace: 'nowrap', marginLeft: 8 }}>
                  {formatDate(exp.startDate)} – {exp.currently ? 'Present' : formatDate(exp.endDate)}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#555', marginBottom: 2 }}>{exp.company}</div>
              {exp.summary && (
                <p style={{ fontSize: 11.5, color: '#444', margin: '2px 0' }}>{exp.summary}</p>
              )}
              {exp.highlights.filter(Boolean).length > 0 && (
                <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
                  {exp.highlights.filter(Boolean).map((h, i) => (
                    <li key={i} style={{ fontSize: 11.5, color: '#444', marginBottom: 1 }}>
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </>
      )}

      {/* ─── Education ─── */}
      {education.length > 0 && (
        <>
          <div style={sectionTitle}>Education</div>
          <hr style={divider} />
          {education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: 12.5 }}>{edu.institution || '—'}</strong>
                <span style={{ fontSize: 11, color: '#666', whiteSpace: 'nowrap', marginLeft: 8 }}>
                  {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#555' }}>
                {[edu.studyType, edu.area].filter(Boolean).join(' – ')}
                {edu.gpa ? `  |  GPA: ${edu.gpa}` : ''}
              </div>
              {edu.courses.filter(Boolean).length > 0 && (
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                  Khóa học: {edu.courses.filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* ─── Skills ─── */}
      {skills.length > 0 && (
        <>
          <div style={sectionTitle}>Skills</div>
          <hr style={divider} />
          {skills.map((s) => (
            <div key={s.id} style={{ display: 'flex', marginBottom: 4, gap: 4, fontSize: 11.5 }}>
              <strong style={{ minWidth: 140 }}>
                {s.name}
                {s.level ? ` (${s.level})` : ''}:
              </strong>
              <span style={{ color: '#444' }}>{s.keywords.filter(Boolean).join(', ')}</span>
            </div>
          ))}
        </>
      )}

      {/* ─── Languages ─── */}
      {languages.length > 0 && (
        <>
          <div style={sectionTitle}>Languages</div>
          <hr style={divider} />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {languages.map((l) => (
              <div key={l.id} style={{ fontSize: 11.5 }}>
                <strong>{l.language}</strong>
                {l.fluency ? ` – ${l.fluency}` : ''}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── Projects ─── */}
      {projects.length > 0 && (
        <>
          <div style={sectionTitle}>Projects</div>
          <hr style={divider} />
          {projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <strong style={{ fontSize: 12.5 }}>{proj.name || '—'}</strong>
                  {proj.url && (
                    <span
                      style={{ fontSize: 10.5, color: primaryColor, marginLeft: 8, fontWeight: 400 }}
                    >
                      {proj.url}
                    </span>
                  )}
                </div>
                {(proj.startDate || proj.endDate) && (
                  <span style={{ fontSize: 11, color: '#666', whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {formatDate(proj.startDate)}
                    {proj.endDate ? ` – ${formatDate(proj.endDate)}` : ''}
                  </span>
                )}
              </div>
              {proj.description && (
                <p style={{ fontSize: 11.5, color: '#444', margin: '2px 0' }}>{proj.description}</p>
              )}
              {proj.highlights.filter(Boolean).length > 0 && (
                <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
                  {proj.highlights.filter(Boolean).map((h, i) => (
                    <li key={i} style={{ fontSize: 11.5, color: '#444', marginBottom: 1 }}>
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default function CvPreview({ cvData }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [innerHeight, setInnerHeight] = useState(1123);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth - 2;
        setScale(Math.max(0.3, w / CV_WIDTH));
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (innerRef.current) {
      setInnerHeight(innerRef.current.scrollHeight);
    }
  });

  const scaledHeight = innerHeight * scale;

  return (
    <div
      ref={containerRef}
      style={{ borderRadius: 4, overflow: 'hidden', height: scaledHeight + 1 }}
    >
      <div
        ref={innerRef}
        style={{
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          width: CV_WIDTH,
        }}
      >
        <CvDocument cvData={cvData} />
      </div>
    </div>
  );
}

export { CvDocument, CV_WIDTH };
