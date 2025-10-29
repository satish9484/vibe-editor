'use client';

import { useEffect, useRef } from 'react';

interface SuggestionWidgetProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  monaco: any;
  suggestion: string;
  position: { line: number; column: number };
  onAccept: () => void;
  onReject: () => void;
}

class SuggestionWidget {
  private domNode: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private editor: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private position: any | null = null;

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor: any,
    suggestion: string,
    position: { line: number; column: number },
    onAccept: () => void,
    onReject: () => void
  ) {
    this.editor = editor;
    this.domNode = document.createElement('div');

    // Style the widget container
    this.domNode.className = 'suggestion-widget-container';
    this.domNode.style.cssText = `
      display: inline-flex;
      gap: 4px;
      align-items: center;
      padding: 2px;
      margin-left: 8px;
      vertical-align: middle;
      z-index: 1000;
    `;

    // Create accept button
    const acceptButton = document.createElement('button');
    acceptButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    acceptButton.title = 'Accept suggestion (Tab)';
    acceptButton.className = 'suggestion-button accept-button';
    acceptButton.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: 1px solid #30363D;
      background: #21262D;
      color: #7EE787;
      cursor: pointer;
      border-radius: 4px;
      padding: 0;
      transition: all 0.2s ease;
    `;

    // Create reject button
    const rejectButton = document.createElement('button');
    rejectButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    rejectButton.title = 'Reject suggestion (Escape)';
    rejectButton.className = 'suggestion-button reject-button';
    rejectButton.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: 1px solid #30363D;
      background: #21262D;
      color: #F85149;
      cursor: pointer;
      border-radius: 4px;
      padding: 0;
      transition: all 0.2s ease;
    `;

    // Add hover styles
    acceptButton.onmouseenter = () => {
      acceptButton.style.borderColor = '#7EE787';
      acceptButton.style.background = '#1B4721';
      acceptButton.style.transform = 'scale(1.05)';
    };
    acceptButton.onmouseleave = () => {
      acceptButton.style.borderColor = '#30363D';
      acceptButton.style.background = '#21262D';
      acceptButton.style.transform = 'scale(1)';
    };

    rejectButton.onmouseenter = () => {
      rejectButton.style.borderColor = '#F85149';
      rejectButton.style.background = '#5A2428';
      rejectButton.style.transform = 'scale(1.05)';
    };
    rejectButton.onmouseleave = () => {
      rejectButton.style.borderColor = '#30363D';
      rejectButton.style.background = '#21262D';
      rejectButton.style.transform = 'scale(1)';
    };

    // Add click handlers
    acceptButton.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      onAccept();
    };

    rejectButton.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      onReject();
    };

    // Append buttons to container
    this.domNode.appendChild(acceptButton);
    this.domNode.appendChild(rejectButton);

    // Update position to be after the suggestion
    this.updatePosition(position, suggestion);
  }

  updatePosition(position: { line: number; column: number }, suggestion: string) {
    // Calculate the position at the end of the suggestion text
    const lines = suggestion.split('\n');
    const endLine = position.line + lines.length - 1;
    const endColumn = lines.length === 1 ? position.column + suggestion.length : lines[lines.length - 1].length + 1;

    // Use numeric values for ContentWidgetPositionPreference
    const ABOVE = 0;
    const BELOW = 1;

    this.position = {
      position: {
        lineNumber: endLine,
        column: endColumn,
      },
      preference: [ABOVE, BELOW],
    };
  }

  getId(): string {
    return 'suggestion-widget';
  }

  getDomNode(): HTMLElement {
    return this.domNode;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPosition(): any {
    return this.position;
  }

  dispose() {
    if (this.domNode.parentNode) {
      this.domNode.parentNode.removeChild(this.domNode);
    }
  }
}

export const useSuggestionWidget = ({ editor, monaco, suggestion, position, onAccept, onReject }: SuggestionWidgetProps) => {
  const widgetRef = useRef<SuggestionWidget | null>(null);

  useEffect(() => {
    // Only create widget if editor is mounted and suggestion is active
    if (!editor || !monaco || !suggestion || !position) {
      // Cleanup if suggestion is cleared
      if (widgetRef.current) {
        widgetRef.current.dispose();
        widgetRef.current = null;
      }
      return;
    }

    // Create or update widget
    if (!widgetRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      widgetRef.current = new SuggestionWidget(editor as any, suggestion, position, onAccept, onReject);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor as any).addContentWidget(widgetRef.current);
    } else {
      // Update widget position if already exists
      widgetRef.current.updatePosition(position, suggestion);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor as any).layoutContentWidget(widgetRef.current);
    }

    return () => {
      // Cleanup on unmount
      if (widgetRef.current) {
        widgetRef.current.dispose();
        widgetRef.current = null;
      }
    };
  }, [editor, monaco, suggestion, position, onAccept, onReject]);
};

export { SuggestionWidget };
