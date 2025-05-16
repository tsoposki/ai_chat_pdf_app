"use client";

import React, { ReactElement } from "react";
import dynamic from 'next/dynamic';
import { Worker } from "@react-pdf-viewer/core";
import { Viewer } from "@react-pdf-viewer/core";
import {
  defaultLayoutPlugin,
  ToolbarProps,
  ToolbarSlot,
} from "@react-pdf-viewer/default-layout";

// Import styles
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/core/lib/styles/index.css";

// Dynamically import the PDF viewer with SSR disabled
const PDFViewerComponent = ({ url }: { url: string }) => {
  const renderToolbar = (Toolbar: (props: ToolbarProps) => ReactElement) => (
    <Toolbar>
      {(slots: ToolbarSlot) => {
        const {
          CurrentPageInput,
          Download,
          EnterFullScreen,
          GoToNextPage,
          GoToPreviousPage,
          NumberOfPages,
          Print,
          ShowSearchPopover,
          Zoom,
          ZoomIn,
          ZoomOut,
        } = slots;
        return (
          <div
            style={{
              alignItems: "center",
              display: "flex",
              width: "100%",
            }}
          >
            <div style={{ padding: "0px 2px" }}>
              <ShowSearchPopover />
            </div>
            <div style={{ padding: "0px 2px" }}>
              <ZoomOut />
            </div>
            <div style={{ padding: "0px 2px" }}>
              <Zoom />
            </div>
            <div style={{ padding: "0px 2px" }}>
              <ZoomIn />
            </div>
            <div style={{ padding: "0px 2px", marginLeft: "auto" }}>
              <GoToPreviousPage />
            </div>
            <div style={{ padding: "0px 2px", width: "3rem" }}>
              <CurrentPageInput />
            </div>
            <div style={{ padding: "0px 2px" }}>
              / <NumberOfPages />
            </div>
            <div style={{ padding: "0px 2px" }}>
              <GoToNextPage />
            </div>
            <div style={{ padding: "0px 2px", marginLeft: "auto" }}>
              <EnterFullScreen />
            </div>
            <div style={{ padding: "0px 2px" }}>
              <Download />
            </div>
            <div style={{ padding: "0px 2px" }}>
              <Print />
            </div>
          </div>
        );
      }}
    </Toolbar>
  );
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar,
    sidebarTabs: () => [],
  });

  return (
    <div className="w-1/2 h-[calc(100vh-60px)]">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
        <Viewer
          plugins={[defaultLayoutPluginInstance]}
          fileUrl={url}
        />
      </Worker>
    </div>
  );
};

// Export a dynamically imported version with SSR disabled
export const PDFViewer = dynamic(() => Promise.resolve(PDFViewerComponent), {
  ssr: false
});
