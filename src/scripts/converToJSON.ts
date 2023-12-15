export function convertToJson(data: any): string {
    let cache: any[] = [];

    let str: string = JSON.stringify(
        data,
        function (key, value) {
            if (typeof value === "object" && value !== null) {
                // @ts-ignore
                if (cache.includes(value)) {
                    // Если значение уже было обработано, замените его на строку
                    return;
                }
                // Добавьте значение в кэш
                cache.push(value);
            }
            if (typeof value === "function") {
                // Преобразуйте функцию в строку
                return value.toString();
            }
            return value;
        },
        2 // Добавляем отступы
    );

    return unescapeJsonString(str);
}

export function unescapeJsonString(jsonString: string): string {
    return jsonString.replace(/\\(.)/g, '$1');
}
