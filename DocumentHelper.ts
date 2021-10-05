import * as vscode from 'vscode';
import { HitResult } from './types';
import { getKeyword, getKeywordNames, getKeywordsProperty } from './utils';

export const getDocumentSymbols = (document: vscode.TextDocument): Thenable<vscode.DocumentSymbol[] | undefined> => {
    return new Promise((resolve) => {
        (async () => {
            const symbols: vscode.DocumentSymbol[] | undefined = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );
            if (!symbols) {
                resolve(undefined);
                return;
            }

            const result: vscode.DocumentSymbol[] = [];
            for (const symbol of symbols) {
                result?.push(...getDocumentSymbolChildren(symbol));
            }

            resolve(result);
        })();
    });
};

const getDocumentSymbolChildren = (symbol: vscode.DocumentSymbol): vscode.DocumentSymbol[] => {
    let result: vscode.DocumentSymbol [] = [];
    result.push(symbol);
    for (const child of symbol.children) {
        result.push(...getDocumentSymbolChildren(child));
    }
    return result;
};

export const navigateToHitResult = (hit: HitResult, editor?: vscode.TextEditor) => {
    const editorToUse = editor ?? vscode.window.activeTextEditor;
    if (!editorToUse) return;
    editorToUse.selection = new vscode.Selection(hit.range.start, hit.range.start);
    editorToUse.revealRange(hit.range, vscode.TextEditorRevealType.InCenter);
};

export const getResultsForKeyword = (keyword: string, document?: vscode.TextDocument, range?: vscode.Range): HitResult[] => {
    // Check if there is actualy text to check
    if (!document || !document?.getText?.(range)?.length) return [];

    const keywordProps = getKeyword(keyword);
    let result: HitResult[] = [];
    const regex = new RegExp(
        `\\b(${keyword}${keywordProps?.mustIncludeColon ?? true ? ':' : ''})`,
        `${keywordProps?.caseSensitive ?? true ? '' : 'i'}gm`
    );
    // Loop over all the regex matches and create HitResults
    let match: RegExpExecArray | null;
    while (match = regex.exec(document.getText(range))) {
        const pos = document.positionAt(match.index + (range?.start ? document.offsetAt(range?.start) : 0));
        const hitRange = new vscode.Range(pos, document.positionAt(match.index + (range?.start ? document.offsetAt(range?.start) : 0) + match[0].length - ((keywordProps?.mustIncludeColon ?? true ? 1 : 0))));
        result.push({
            keyword,
            comment: document.lineAt(pos).text.slice(pos.character).trim(),
            note: document.lineAt(pos).text.slice(pos.character + keyword.length + ((keywordProps?.mustIncludeColon ?? true) ? 1 : 0)).trim(),
            position: pos,
            range: hitRange,
            lineNumber: pos.line + 1,
        });
    }
    // Sort the results based on line number
    result.sort((last, curr) => {
        if (last.lineNumber < curr.lineNumber) return -1;
        if (last.lineNumber > curr.lineNumber) return 1;
        return 0;
    });
    return result;
};

export const getResultsForGroup = (group: string, document?: vscode.TextDocument, range?: vscode.Range): HitResult[] => {
    // Check if there is actualy text to check
    if (!document || !document?.getText?.(range)?.length) return [];

    // Get HitResults for all the keywords inside a group
    let result: HitResult[] = [];
    const keywords = getKeywordsProperty();
    for (const keyword in keywords) {
        const keywordProps = keywords[keyword];
        if (!keywordProps?.group || keywordProps?.group !== group) continue;
        result.push(...getResultsForKeyword(keyword, document, range));
    }

    // Sort the results based on line number
    result.sort((last, curr) => {
        if (last.lineNumber < curr.lineNumber) return -1;
        if (last.lineNumber > curr.lineNumber) return 1;
        return 0;
    });
    return result;
};

export const getCountForKeyword = (keyword: string, document?: vscode.TextDocument, range?: vscode.Range): number => {
    // Check if there is actualy text to check
    if (!document || !document?.getText?.(range)?.length) return 0;

    const keywordProps = getKeyword(keyword);
    const regex = new RegExp(
        `\\b(${keyword}${keywordProps?.mustIncludeColon ?? true ? ':' : ''})`,
        `${keywordProps?.caseSensitive ?? true ? '' : 'i'}gm`
    );
    let count = 0;
    while (regex.exec(document.getText(range))) {
        count++;
    }
    return count;
};

export const getCountForGroup = (group: string, document?: vscode.TextDocument, range?: vscode.Range): number => {
    // Check if there is actualy text to check
    if (!document || !document?.getText?.(range)?.length) return 0;

    let count = 0;
    for (const keyword of getKeywordNames()) {
        const keywordProps = getKeyword(keyword);
        if (!keywordProps?.group || keywordProps?.group !== group) continue;
        count += getCountForKeyword(keyword, document, range);
    }
    return count;
};

export const onDocumentChangeListener = (context: vscode.ExtensionContext, callback: () => void) => {
	vscode.window.onDidChangeActiveTextEditor(() => {
		callback();
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(() => {
		callback();
	}, null, context.subscriptions);

};

export default {
    getDocumentSymbols,
    navigateToHitResult,
    getResultsForKeyword,
    getResultsForGroup,
    getCountForKeyword,
    getCountForGroup,
    onDocumentChangeListener
};
