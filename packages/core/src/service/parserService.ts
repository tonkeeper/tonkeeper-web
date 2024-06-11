export const csvStringToArray = (strData: string) => {
    if (!strData) {
        return [];
    }
    // TODO review and throw errors if format is wrong
    const objPattern = new RegExp(
        '(\\,|\\r?\\n|\\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^\\,\\r\\n]*))',
        'gi'
    );
    let arrMatches = null;
    const arrData: string[][] = [[]];

    while ((arrMatches = objPattern.exec(strData))) {
        if (arrMatches[1].length && arrMatches[1] !== ',') arrData.push([]);
        arrData[arrData.length - 1].push(
            arrMatches[2] ? arrMatches[2].replace(new RegExp('""', 'g'), '"') : arrMatches[3]
        );
    }
    return arrData;
};

export const arrayToCsvString = (arrData: string[][]) => {
    const formatRow = (row: string[]) => {
        return row
            .map(val => {
                val = val.replace(/"/g, '""');
                if (val.search(/([",\n])/g) >= 0) {
                    val = '"' + val + '"';
                }
                return val;
            })
            .join(',');
    };

    return arrData.map(formatRow).join('\n');
};
