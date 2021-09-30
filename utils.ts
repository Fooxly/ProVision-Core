import { coreConfig } from '.';
import { FALLBACK_KEYWORDS } from './consts';
import { Keyword } from './types';

// Get a list of all the keywords
export const getKeywordNames = (): string[] => {
    const keywords = coreConfig.get<any>('keywords') ?? FALLBACK_KEYWORDS;
    return Object.keys(keywords);
};

// Get the properties of all the keywords
export const getKeyword = (key: string): Keyword => {
    return getKeywordsProperty()[key];
};

// Get the keywords property object
export const getKeywordsProperty = (): any => {
    return coreConfig.get<any>('keywords') ?? FALLBACK_KEYWORDS;
};

// Get the keyword names by group
export const getKeywordNamesByGroup = (group: string): string[] => {
    const keywords = coreConfig.get<any>('keywords') ?? FALLBACK_KEYWORDS;
    const result = [];
    for (const keyword in keywords) {
        if (keywords[keyword]?.group === group) result.push(keyword);
    }
    return result;
};

export const getGroups = (): string[] => {
    const keywords = coreConfig.get<any>('keywords') ?? FALLBACK_KEYWORDS;
    const result: string[] = [];
    for (const keyword in keywords) {
        if (keywords[keyword]?.group?.length && !result.includes(keywords[keyword]?.group)) result.push(keywords[keyword]?.group);
    }
    return result;
};

export default {
    getKeywordNames,
    getKeyword,
    getKeywordsProperty,
    getKeywordNamesByGroup,
    getGroups,
};

