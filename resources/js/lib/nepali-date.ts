import NepaliDate from 'nepali-date-converter';

// Initialize if needed, though mostly it works out of the box
// We can extend prototype or just export helpers

export const getNepaliDate = (date?: Date | string) => {
    const d = date ? new Date(date) : new Date();
    return new NepaliDate(d);
};

export const toBS = (date: Date | string): string => {
    const nd = getNepaliDate(date);
    return nd.format('YYYY-MM-DD');
};

export const formatBS = (date: Date | string, format: string = 'YYYY-MM-DD'): string => {
    const nd = getNepaliDate(date);
    return nd.format(format);
};

export const getNepaliMonthName = (date: Date | string): string => {
    const nd = getNepaliDate(date);
    // Format 'M' gives month number, 'MM' 0-padded. 'MMMM' gives full name?
    // Check lib docs or types. Usually format() supports standard tokens.
    // Assuming standard format tokens: 
    // YYYY, YY, M, MM, MMMM (month name), D, DD, d (week day), dddd (week day name)
    return nd.format('MMMM');
};

export const getBSYearMonth = (date?: Date | string): string => {
    const nd = getNepaliDate(date);
    return nd.format('YYYY-MM');
};

export const getBSDateObject = (date?: Date | string) => {
    const nd = getNepaliDate(date);
    return {
        year: nd.getYear(),
        month: nd.getMonth(), // 0-11
        day: nd.getDate(),
    };
};
