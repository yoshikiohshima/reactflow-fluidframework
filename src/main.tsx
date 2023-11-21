import React, { useCallback, useState } from 'react';
import ReactDOM from 'react-dom/client'
import './index.css'
import FlowView from "./fluidView.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
     <FlowView />
  </React.StrictMode>,
)
