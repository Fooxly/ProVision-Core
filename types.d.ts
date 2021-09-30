import * as vscode from 'vscode';

interface Keyword {
    caseSensitive?: boolean;
    mustIncludeColon?: boolean;
    color?: string;
    backgroundColor?: string;
    rulerPlacement?: 'left' | 'right';
    rulerColor?: string;
    highlight?: 'keyword' | 'line';
    group?: string;
}

interface Group {
    title?: {
        "1"?: string;
        "*": string;
    } | string;
    tooltip?: string; 
    foregroundStyle?: string;
    backgroundStyle?: string;
}

interface HitResult {
    keyword: string;
    comment: string;
    note: string;
    range: vscode.Range;
    position: vscode.Position;
    lineNumber: number;
}
