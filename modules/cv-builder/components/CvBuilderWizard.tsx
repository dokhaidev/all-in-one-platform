'use client';

import React, { useState, useEffect } from 'react';
import { Button, Typography } from 'antd';
import {
  FormatPainterOutlined,
  UserOutlined,
  SolutionOutlined,
  ReadOutlined,
  CodeOutlined,
  GlobalOutlined,
  ProjectOutlined,
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  EyeOutlined,
} from '@ant-design/icons';

import { CvData } from '../types';
import { EMPTY_CV_DATA, SAMPLE_CV_DATA } from '../constants/defaults';
import CvPreview from './CvPreview';
import StepDesign from './steps/StepDesign';
import StepPersonalInfo from './steps/StepPersonalInfo';
import StepExperience from './steps/StepExperience';
import StepEducation from './steps/StepEducation';
import StepSkills from './steps/StepSkills';
import StepLanguages from './steps/StepLanguages';
import StepProjects from './steps/StepProjects';
import StepExport from './steps/StepExport';

const STORAGE_KEY = 'toolhub_cv_data_v2';

const STEPS = [
  { label: 'Giao diện', icon: <FormatPainterOutlined /> },
  { label: 'Thông tin', icon: <UserOutlined /> },
  { label: 'Kinh nghiệm', icon: <SolutionOutlined /> },
  { label: 'Học vấn', icon: <ReadOutlined /> },
  { label: 'Kỹ năng', icon: <CodeOutlined /> },
  { label: 'Ngoại ngữ', icon: <GlobalOutlined /> },
  { label: 'Dự án', icon: <ProjectOutlined /> },
  { label: 'Xuất file', icon: <DownloadOutlined /> },
];

export default function CvBuilderWizard() {
  const [step, setStep] = useState(0);
  // Initialize with SAMPLE_CV_DATA so preview is always full on first render
  const [cvData, setCvData] = useState<CvData>(SAMPLE_CV_DATA);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount — only override if user has real saved data (has a name)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: CvData = JSON.parse(saved);
        if (parsed?.personal?.name) {
          setCvData(parsed);
        }
      }
    } catch {
      /* ignore, keep SAMPLE_CV_DATA */
    }
    setLoaded(true);
  }, []);

  // Auto-save to localStorage (only after initial load to avoid overwriting with sample)
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cvData));
  }, [cvData, loaded]);

  const update = (patch: Partial<CvData>) =>
    setCvData((prev) => ({ ...prev, ...patch }));

  const stepContent = [
    <StepDesign key="design" design={cvData.design} onChange={(design) => update({ design })} />,
    <StepPersonalInfo key="personal" personal={cvData.personal} onChange={(personal) => update({ personal })} />,
    <StepExperience key="exp" experience={cvData.experience} onChange={(experience) => update({ experience })} />,
    <StepEducation key="edu" education={cvData.education} onChange={(education) => update({ education })} />,
    <StepSkills key="skills" skills={cvData.skills} onChange={(skills) => update({ skills })} />,
    <StepLanguages key="lang" languages={cvData.languages} onChange={(languages) => update({ languages })} />,
    <StepProjects key="proj" projects={cvData.projects} onChange={(projects) => update({ projects })} />,
    <StepExport key="export" cvData={cvData} onChange={(data) => setCvData(data)} />,
  ];

  return (
    <div>
      {/* ─── Main Split Layout ─── */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Left: Form */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ─── Step Indicator ─── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              marginBottom: 24,
            }}
          >
            {STEPS.map((s, i) => {
              const isActive = i === step;
              const isDone = i < step;
              const color = isActive ? '#50C878' : isDone ? '#50C878' : '#444';
              const bgColor = isActive ? '#50C878' : isDone ? 'rgba(80,200,120,0.18)' : '#252525';
              const textColor = isActive ? '#fff' : isDone ? '#50C878' : '#555';

              return (
                <React.Fragment key={i}>
                  {/* Step circle + label */}
                  <div
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => setStep(i)}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: bgColor,
                        border: `2px solid ${color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? '#fff' : textColor,
                        fontSize: 15,
                        transition: 'all 0.2s',
                      }}
                    >
                      {s.icon}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        marginTop: 4,
                        color: isActive ? '#e0e0e0' : '#555',
                        whiteSpace: 'nowrap',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>

                  {/* Connector line — flex: 1 để tự dãn đều */}
                  {i < STEPS.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background: i < step ? '#50C878' : '#2a2a2a',
                        margin: '0 4px',
                        marginBottom: 16,
                        transition: 'background 0.2s',
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
              paddingBottom: 14,
              borderBottom: '1px solid #2a2a2a',
            }}
          >
            <span style={{ color: '#50C878', fontSize: 20 }}>{STEPS[step].icon}</span>
            <Typography.Title
              level={4}
              style={{ color: '#e0e0e0', margin: 0, fontWeight: 700 }}
            >
              {STEPS[step].label}
            </Typography.Title>
          </div>

          {/* Step content */}
          <div style={{ flex: 1 }}>{stepContent[step]}</div>

          {/* Navigation */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid #2a2a2a',
            }}
          >
            <Button
              icon={<LeftOutlined />}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Quay lại
            </Button>

            <span style={{ color: '#444', fontSize: 12 }}>
              {step + 1} / {STEPS.length}
            </span>

            {step < STEPS.length - 1 ? (
              <Button
                type="primary"
                icon={<RightOutlined />}
                iconPosition="end"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              >
                Tiếp tục
              </Button>
            ) : (
              <div style={{ width: 96 }} />
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            position: 'sticky',
            top: 16,
            height: 'calc(100vh - 80px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              flexShrink: 0,
            }}
          >
            <EyeOutlined style={{ color: '#50C878', fontSize: 16 }} />
            <span style={{ color: '#888', fontSize: 13, fontWeight: 500 }}>Xem trước</span>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              borderRadius: 4,
              scrollbarWidth: 'thin',
              scrollbarColor: '#333 transparent',
            }}
          >
            <CvPreview cvData={cvData} />
          </div>
        </div>
      </div>
    </div>
  );
}
