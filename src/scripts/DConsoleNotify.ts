import { convertToJson } from './converToJSON';
import '../../src/assets/styles/scss/style.scss';

interface Options {
    all?: boolean
    log?: boolean;
    info?: boolean;
    debug?: boolean;
    warn?: boolean;
    error?: boolean;
    lifetime?: number;
}

export class DConsoleNotify {
    private static instance: DConsoleNotify
    private notification: Element;
    private container: Element;
    private notifications: HTMLElement[];
    private notificationsTitle: Object;
    private options: Options = {}
    private defOptions: Options = {
        all: false,
        log: false,
        info: false,
        debug: false,
        warn: false,
        error: false,
        lifetime: 20000,
    }

    constructor(options: Object = {}) {
        // Проверям на запущен ли сервис логировния через уведомления
        if (DConsoleNotify.instance) return DConsoleNotify.instance
        DConsoleNotify.instance = this;

        this.setOptions(options)
        this.rewireLoggingToElement();

        this.notificationsTitle = {
            log: "log",
            info: "inform",
            debug: "debug",
            warn: "warning",
            error: "error",
        }
    }


    // Инициализация базовой конфигурации уведомлений, которые могут быть удалены и добавлены
    private initBaseNotification (): void {
        // создаем модуль уведомлений
        this.notification = document.createElement('div');
        this.notification.classList.add('dnotification');

        // создаем в нем контейнер
        this.container = document.createElement('div');
        this.container.classList.add('dnotification-container');

        // создаем элемент закрытия всех уведомлений
        const closeAll:HTMLElement = document.createElement('div');
        closeAll.classList.add('dnotification-close-all', 'close-icon')

        // располагаем элементы на страницы
        this.notification.appendChild(this.container);
        this.notification.appendChild(closeAll);
        document.body.appendChild(this.notification);

        this.notifications = [];
        this.blockPageScroll();

        // Обработчик события нажатия на закрытие всех уведомлений
        closeAll.addEventListener("click", (e) => {
            for (let i = 0; i < this.notifications.length; i++) {
                this.hideNotification(this.notifications[i])
            }
        })
    }


    // Создание нового элемента уведомлений
    public createNotificationElement(data: string, type: string): void {
        // уведомление уже отображается
        if (!this.notification) {
            this.initBaseNotification();
        }

        const notificationElement = document.createElement('div') as HTMLElement;
        notificationElement.classList.add('dnotification-item', type);

        const header = document.createElement('div') as HTMLElement;
        header.classList.add('dnotification-item__header');

        const title = document.createElement('h2') as HTMLElement;
        title.textContent = this.notificationsTitle[type];

        const closeButton = document.createElement('div') as HTMLElement;
        closeButton.classList.add('close-notification', 'close-icon');

        const messageWrapper = document.createElement('div') as HTMLElement;
        messageWrapper.classList.add('dnotification-item__message-wrapper');

        const message = document.createElement('pre') as HTMLElement;
        message.classList.add('dnotification-item__message');
        // message.innerHTML = data;

        const code = document.createElement('code') as HTMLElement;
        code.textContent = data;

        header.appendChild(title);
        header.appendChild(closeButton);

        message.appendChild(code);
        messageWrapper.appendChild(message);

        notificationElement.appendChild(header);
        notificationElement.appendChild(messageWrapper);

        this.container.prepend(notificationElement);
        this.notifications.push(notificationElement);

        // плавное отображение
        setTimeout(() => {
            notificationElement.classList.add('show');
        }, 100);

        // добавляем таймер на автоудаление
        this.addTimeoutToRemove(notificationElement);

        // добавляем событие на закрытие уведомления
        closeButton.addEventListener('click', () => {
            this.hideNotification(notificationElement);
        });
    }


    // Очистка станицы от уведомлений
    private clearNotification(): void {
        this.unblockPageScroll();
        this.notification.remove();
        this.notification = null;
    }


    // Блокирование прокрутки страницы
    private blockPageScroll(): void {
        document.body.classList.add('no-scroll');
    }


    // Разблакирование прокрутки страницы
    private unblockPageScroll(): void {
        document.body.classList.remove('no-scroll');
    }


    // Добавление счетчика удаления элемента уведомления
    private addTimeoutToRemove(not: HTMLElement): void {
        // Если время жизни = 0, не добавляем таймер на удаление
        if (this.options.lifetime == 0) return

        let timeoutId: number = this.setTimeoutRemove(not)

        not.addEventListener('mouseenter', () => {
            clearTimeout(timeoutId);
        });

        not.addEventListener('mouseleave', () => {
            timeoutId = this.setTimeoutRemove(not)
        });
    }


    // Установление setTimeout для удаления элемента
    private setTimeoutRemove(not: HTMLElement): number {
        return  window.setTimeout(() => {
            // Проверяем наличие уведомления
            if (this.notifications.indexOf(not) !== -1) {
                this.hideNotification(not);
            }
        }, this.options.lifetime);
    }


    // Скрытие через таймауту и удаление уведомлений
    private hideNotification(notification: HTMLElement): void {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
            this.notifications = this.notifications.filter((n) => n !== notification);

            if (this.notifications.length === 0) {
                this.clearNotification();
            }
        }, 300);
    }


    // Определение логов отображаемых в уведомлении
    private rewireLoggingToElement(): void {
        if (this.options.log || this.options.all) this.fixLoggingFunc("log");
        if (this.options.debug || this.options.all) this.fixLoggingFunc("debug");
        if (this.options.warn || this.options.all) this.fixLoggingFunc("warn");
        if (this.options.error || this.options.all) this.fixLoggingFunc("error");
        if (this.options.info || this.options.all) this.fixLoggingFunc("info");
    }


    // Переопределение функции логирования
    private fixLoggingFunc(name: string): void {
        const self = this
        console["old" + name] = console[name];
        console[name] = function () {
            // @ts-ignore
            const args = Array.from(arguments);
            const output = self.produceOutput(name, args);

            console["old" + name].apply(undefined, args);
        };
    }


    // Перебираем аргументы и выводим в разных уведомлениях
    private produceOutput(name: string, args: any[]): string {
        return args.reduce((output, arg) => {
            // проверяем, если переданный элемент является
            if (arg instanceof HTMLElement) {
                this.createNotificationElement(arg.outerHTML, name);
                return
            }

            this.createNotificationElement(convertToJson(arg), name);
        }, "");
    }


    // Проверка объекта на пустоту
    private isEmptyObject(obj: object): boolean {
        return Object.keys(obj).length === 0;
    }


    // Меняет настройки уведомлений
    public setOptions(options: Object): void {
        if (this.isEmptyObject(options))  this.options = {...this.defOptions, ...{ error: true }}
        else this.options = {...this.defOptions, ...options}
    }
}