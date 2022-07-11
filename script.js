define(['jquery', 'underscore', 'twigjs'], function ($, _, Twig) {
    var CustomWidget = function () {
        var self = this,
            system = self.system(),
            langs = self.langs,
            task_id = 0; // ID задачиb

        // количество символов для закрытия и создания задач
        this.close_task_length = null;
        this.create_task_length = 3;
        this.taskClosed = false;




        const editSelect = function () {
            var selectItems = self.get_settings().selectItem || [];
            if (selectItems !== 'string') selectItems = JSON.stringify(selectItems);
            selectItems = JSON.parse(selectItems);

            if (selectItems.length == 0) selectItems.unshift({option: 'Выбрать результат'});

            var select = Twig({ ref: '/tmpl/controls/select.twig' }).render({
                items: selectItems,
                class_name: 'close_task_select'
            });

            $('.widget_settings_block__controls').before(select);
            $('.close_task_select').css('margin-bottom', '4px');
            $('.close_task_select .control--select--button').css('width', '278px');
            $('.close_task_select ul').css({
                'width': 'auto',
                'min-width': '265px',
                'max-width': $('.view-integration-modal__tabs').outerWidth(),
                'margin-left': '13px'
            });

            $('.close_task_select').before(`
                <div class="widget_settings_block__title_field" style="martin-top: 10px;">
                    Список результатов задач
                </div>
            `);

            $.each(selectItems, function (index, item) {
                if (item.option == 'Выбрать результат') return;

                var input = Twig({ ref: '/tmpl/controls/input.twig' }).render({
                    name: 'select-item',
                    class_name: 'select__enums__input',
                    value: item.option,
                    placeholder: 'Вариант',
                    max_length: 50
                });

                $('.widget_settings_block__controls').before(`
                    <div class="widget_settings_block__input_field select__enums__item" style="
                        margin-bottom: 4px;
                        width: 100%;
                        position: relative;
                    ">
                        <div class="cf-field-enum__remove" title="{{lang.cf.remove}}" style="width: auto;">
                            <svg class="svg-icon svg-common--trash-dims"><use xlink:href="#common--trash"></use></svg>
                        </div>
                        ${ input }
                    </div>
                `);

                $('.select__enums__input').css('padding-right', '25px');
                $('.cf-field-enum__remove').css({
                    'position': 'absolute',
                    'top': '10px',
                    left: $('.select__enums__input').outerWidth() - 20,
                    'cursor': 'pointer'
                });
            });

            $('.widget_settings_block__controls').before(`
                <div class="widget_settings_block__input_field" style="margin-bottom: 4px;">
                    <span class="js-cf-enum-add cf-field-enum-add select__enums__href" style="
                        display: inline;
                        margin-top: -2px;
                        margin-left: 10px;
                        color: #909090;
                        cursor: pointer;
                        position: relative;
                        border-bottom: 1px solid #92989b;
                    ">
                        Добавить вариант
                    </span>
                </div>
            `);

            $('.select__enums__href').unbind('click');
            $('.select__enums__href').bind('click', function () {
                var input = Twig({ ref: '/tmpl/controls/input.twig' }).render({
                    name: 'select-item',
                    class_name: 'select__enums__input',
                    value: '',
                    placeholder: 'Вариант',
                    max_length: 50
                });

                $('.select__enums__href').before(`
                    <div class="widget_settings_block__input_field select__enums__item" style="
                        margin-bottom: 4px;
                        width: 100%;
                        position: relative;
                    ">
                        <div class="cf-field-enum__remove" title="{{lang.cf.remove}}" style="width: auto;">
                            <svg class="svg-icon svg-common--trash-dims"><use xlink:href="#common--trash"></use></svg>
                        </div>
                        ${ input }
                    </div>
                `);

                $('.select__enums__input').css('padding-right', '25px');
                $('.cf-field-enum__remove').css({
                    'position': 'absolute',
                    'top': '10px',
                    left: $('.select__enums__input').outerWidth() - 20,
                    'cursor': 'pointer'
                });

                $('.cf-field-enum__remove').unbind('click');
                $('.cf-field-enum__remove').bind('click', function (e) {
                    var input = $(e.target).closest('.select__enums__item').find('input');
                    $.each(selectItems, function (index, item) {
                        if (item.option != input.val()) return
                        console.log(item.option);
                        selectItems.splice(index, 1);
                        $(e.target).closest('.select__enums__item').remove();
                    });
                });

                $('.select__enums__input').unbind('change');
                $('.select__enums__input').bind('change', function (e) {
                    var isValue = false,
                        option = $(e.target).val().trim();

                    $.each(selectItems, function (index, item) {
                        if (item.option == option) isValue = true;
                    });

                    if (!isValue) selectItems.push({ option: option });

                    $('input[name="selectItem"]').val(JSON.stringify(selectItems));
                    $('input[name="selectItem"]').trigger('change');

                    console.log(self.get_settings().selectItem);
                });
            });
        }




        // функция отображения списков в задачах и карточке
        const addSelect = function (mutationsList) {
            // если в задачах
            if (AMOCRM.getBaseEntity() === 'todo') {
                $.each(mutationsList, function () {
                    if (this.type === 'attributes') {

                        // если select отсутствует, добавляем
                        var taskWrapper = $('div.card-task__result-wrapper__inner');
                        if (taskWrapper.length) {
                            self.task_id = $(taskWrapper).find('.card-task__button').attr('id');
                            self.addSelectCloseTask();

                            var select = $('div.card-task .close_task_select');
                            var selectUl = $('div.card-task .close_task_select ul');

                            select.css('margin-top', '1px');
                            selectUl.css('width', 'auto');

                            // // закрытие задачи с проверкой по ID
                            self.closeTasks(self.task_id);
                            setTimeout(() => self.sendAjax(self.task_id), 2000);

                            self.task_id = null;
                            return false;
                        }
                    }
                });
            }

            // если в карточке
            if (AMOCRM.isCard() === true) {
                $.each(mutationsList, function () {
                    if (this.type === 'attributes') {

                        $(document).ready(function() {
                            // определяем открытие задачи
                            if ($('div.card-task.card-task-future').hasClass('expanded')) {
                                self.task_id = $('div.card-task.card-task-future.expanded .card-task__button').attr('id');

                                // если скрытого select'a нет, добавляем
                                if (!$('div.close_task_select-hidden').length) self.addSelectCloseTask();
                                // выравниваем
                                var selectHidden = $('div.close_task_select-hidden');
                                selectHidden.css({
                                    'position': 'absolute',
                                    'z-index': '999',
                                    'display': 'none',
                                    'width': 'auto',
                                    'max-width': '170px'
                                });

                                // если select'a нет, добавляем
                                if (!$(`div[data-id="${ self.task_id }"] .close_task_select`).length) self.addSelectCloseTask(self.task_id);
                                // выравниваем
                                var select = $(`div[data-id="${ self.task_id }"] .close_task_select`);
                                select.css({
                                    'margin-top': '1px',
                                    'margin-right': '10px',
                                    'width': 'auto',
                                    'max-width': '170px'
                                });

                                var selectButtonHidden = $('div.close_task_select-hidden button');
                                var selectUlHidden = $('div.close_task_select-hidden ul');
                                var selectLiHidden = $('div.close_task_select-hidden li');
                                var selectButton = $(`div[data-id="${ self.task_id }"] .control--select--button`);
                                var selectButtonSpan = $(`div[data-id="${ self.task_id }"] .control--select--button-inner`);
                                var textarea = $(`div[data-id="${ self.task_id }"] textarea[name="result"]`);

                                // отображаем пункты скрытого select'a при клике на select задачи
                                selectButton.unbind('click');
                                selectButton.bind('click', function (e) {
                                    e.stopPropagation();

                                    // если select был изменен ранее, но задача не закрыта, отображаем прежнее значение
                                    $.each(selectLiHidden, function () {
                                        $(this).removeClass('control--select--list--item-selected');
                                        if (selectButtonSpan.text() === $(this).text()) {
                                            $(this).addClass('control--select--list--item-selected');
                                        }
                                    });

                                    // меняем свойства скрытого select'a и кликаем по нему
                                    selectHidden.css({
                                        'display': 'block',
                                        'left': select.offset().left - $('div.left-menu').outerWidth(),
                                        'top': select.offset().top
                                    });

                                    selectButtonHidden.trigger('click');
                                    selectUlHidden.css({ 'width': 'auto', 'z-index': '30' });
                                    selectUlHidden.removeClass('control--select--list');
                                    selectUlHidden.addClass('control--select--list-opened');
                                });

                                // отображаем скрытый select при открытии пунктов
                                if (selectUlHidden.hasClass('control--select--list-opened')) {
                                    selectHidden.css('display', 'block');
                                } else selectHidden.css('display', 'none');

                                // при выборе пункта скрытого select'a присваиваем результат в select задачи и скрываем
                                selectLiHidden.unbind('click');
                                selectLiHidden.bind('click', function (e) {
                                    selectButtonSpan.text($(e.target).text());

                                    selectUlHidden.css('width', 'auto');
                                    selectUlHidden.removeClass('control--select--list-opened');
                                    selectUlHidden.addClass('control--select--list');
                                });

                                // при потере курсора прячем select (эффект настоящего)
                                selectHidden.mouseleave(function () {
                                    selectHidden.css('display', 'none');
                                    selectUlHidden.removeClass('control--select--list-opened');
                                    selectUlHidden.addClass('control--select--list');
                                });

                                // обнуляем textarea при несоответствии проверки
                                textarea.unbind('change');
                                textarea.bind('change', function () {
                                    if (textarea.val().trim().length < self.close_task_length ||
                                        (textarea.val().trim().length > self.close_task_length &&
                                            selectButton.text() === 'Выбрать результат')) {

                                        textarea.val('');
                                    } else {
                                        if (textarea.val() !== selectButton.text()) {
                                            textarea.val(selectButton.text() + ': ' + textarea.val());
                                            self.taskClosed = true;
                                        }
                                    }
                                });

                                // закрытие задачи с проверкой по ID
                                self.closeTasks(self.task_id);
                                setTimeout(() => self.sendAjax(self.task_id), 2000);

                                self.task_id = null;
                                return false;
                            }});
                    }
                });
            }
        }

        // функция создания задачи
        const createTasks = function(mutationsList) {
            // если в задачах или карточке
            if (AMOCRM.getBaseEntity() === 'todo' || AMOCRM.isCard() === true) {
                // отслеживаем изменение потомков для поиска элементов
                $.each(mutationsList, function () {
                    if (this.type === 'childList') {

                        var button = $('div.feed-compose .feed-note__button');
                        var create_type = $('div.feed-compose .feed-compose-switcher__text');
                        var inputHidden = $('div.feed-compose .js-control-contenteditable-input');
                        var inputText = $('div.feed-compose .js-task-text-textarea');

                        // проверка на валидность длины задачи
                        const isInputLengthFalse = function () {
                            // удаляем пробелы в начале и конце, обновляем текст
                            inputHidden.val(inputHidden.val().trim());
                            inputText.text(inputHidden.val());

                            // в случае неудачи выводим сообщение, красим и останавливаем кнопку
                            if (inputHidden.val().length < self.create_task_length) {
                                button.addClass('true_error_message');
                                self.showErrorMessageTask('create', button);
                                self.redFieldsTaskCreate();
                                return false;
                            }
                            return true;
                        }

                        // обнуляем клик
                        button.unbind('click');
                        // обработчик на кнопке создания задачи
                        button.bind('click', function () {
                            // если не чат и не примечание (в карточке)
                            if (create_type.length) {
                                if (create_type.text() === 'Задача') {
                                    // проверка на валидность длины в задачах
                                    if (!isInputLengthFalse()) return false;
                                }
                            } else {
                                // проверка на валидность длины в карточке
                                if (!isInputLengthFalse()) return false;
                            }
                        });
                    }
                });
            }
        };

        this.observerCreateTasks = new MutationObserver(createTasks);
        this.observerAddSelect = new MutationObserver(addSelect);

        this.sendAjax = function (task_id) {
            if (self.taskClosed) {
                $.ajax({
                    url: '/api/v4/tasks/' + task_id,
                    success: function (data) {
                        var result = {
                            'ID сущности': data.entity_id,
                            'ID задачи': data.id,
                            'Статус задачи': data.is_completed,
                            'Комментарий к задаче': data.result['text']
                        }

                        console.log(result);
                    }
                });
            }

            self.taskClosed = false;
        }

        // функция закрытия задачи с проверкой по ID
        this.closeTasks = function (task_id) {
            var button = $(`div[data-id="${ task_id }"] .card-task__button`);

            button.unbind('click');
            button.bind('click', function () {
                var selectButton = $(`div[data-id="${ task_id }"] .control--select--button`);
                var textarea = $(`div[data-id="${ task_id }"] textarea[name="result"]`);

                // удаляем лишние пробелы в строке
                textarea.val(textarea.val().trim());

                // если проверка не пройдена
                if (textarea.val().length < self.close_task_length || selectButton.text() === 'Выбрать результат') {
                    // добавляем класс ошибки к кнопке, красим поля и останавливаем
                    button.addClass('true_error_message');
                    self.showErrorMessageTask('close', button, task_id);
                    self.redFieldsTaskClose(task_id);
                    self.taskClosed = false;
                    return false;
                } else {
                    // результат выполнения задачи
                    if (textarea.val() === '') {
                        textarea.val(selectButton.text());
                        textarea.trigger('change');
                    }
                    else if (AMOCRM.getBaseEntity() === 'todo') {
                        textarea.val(selectButton.text() + ': ' + textarea.val());
                        textarea.trigger('change');
                    }
                }

                // удаляем класс ошибки с кнопки в случае успеха
                button.removeClass('true_error_message');
                self.taskClosed = true;
            });

            return self.taskClosed;
        }

        // функция показа сообщения об ошибке
        this.showErrorMessageTask = function (task_type, button, task_id = null) {
            var errorMessage = $(`div.${ task_type }_error_message_tasks`);
            var left, buttonMessage;

            if (!task_id) buttonMessage = $('button.true_error_message');
            else buttonMessage = $(`div[data-id="${ task_id }"] .true_error_message`);

            // отображаем сообщение
            errorMessage.css('display', 'block');

            // позиционируем относительно кнопки
            var resize = function () {
                if (task_type === 'create') left = buttonMessage.offset().left;
                else left = buttonMessage.offset().left - errorMessage.outerWidth() + button.outerWidth();

                errorMessage.offset({
                    left: left,
                    top: buttonMessage.offset().top - errorMessage.outerHeight() - 30
                });
            }

            resize();

            // при наведении мыши на кнопку показываем
            buttonMessage.mouseover(function () {
                if ($(button).hasClass('true_error_message')) {
                    errorMessage.css('display', 'block');
                    resize();
                }
            });

            // при потере фокуса скрываем
            buttonMessage.mouseout(function () { errorMessage.css('display', 'none'); });
        }

        // функция смены цвета полей при ошибке создания задачи
        this.redFieldsTaskCreate = function () {
            var button, inputText = $('div.card-task__actions .js-task-text-textarea');

            // в задачах и карточке кнопки разные
            if (AMOCRM.getBaseEntity() === 'todo') button = $('div.card-task__buttons .feed-note__button');
            if (AMOCRM.isCard() === true) button = $('div.feed-compose__actions .feed-note__button');

            // красим кнопку
            button.attr('style', 'background: #f57d7d !important');

            // при валидной длине задачи возвращаем естесственный цвет, иначе цвет ошибки
            inputText.bind('input', function () {
                if (inputText.text().trim().length >= self.create_task_length) {
                    button.attr('style', 'background: #8591a5 !important');
                    button.removeClass('true_error_message');
                }
                else {
                    button.attr('style', 'background: #f57d7d !important');
                    button.addClass('true_error_message');
                }
            });
        }

        // функция смены цвета полей при ошибке закрытия задачи
        this.redFieldsTaskClose = function (task_id) {
            var button = $(`div[data-id="${ task_id }"] .card-task__button`);
            var textarea = $(`div[data-id="${ task_id }"] textarea[name="result"]`);
            var selectButton = $(`div[data-id="${ task_id }"] .control--select--button`);

            // красим поля, если условие проверки не выполнено
            button.css('border-color', '#f37575').css('background', '#f57d7d');
            if (textarea.val().length < self.close_task_length) textarea.css('border-color', '#f37575');
            if (selectButton.text() === 'Выбрать результат') selectButton.css('border-color', '#f37575');

            // возвращаем цвет select и/или кнопки в случае успеха
            $(document).ready(function(){
                selectButton.unbind('DOMSubtreeModified');
                selectButton.bind('DOMSubtreeModified', function(){

                    // если значение select'a по умолчанию
                    if (selectButton.text() === 'Выбрать результат') {

                        selectButton.css('border-color', '#f37575');
                        button.css('border-color', '#f37575').css('background', '#f57d7d');
                        // добавляем класс с ошибкой к кнопке
                        button.addClass('true_error_message');

                        // иначе, если textarea соответствует условию и select изменен
                    } else if (textarea.val().length >= self.close_task_length &&
                        selectButton.text() !== 'Выбрать результат') {

                        selectButton.css('border-color', '#d7d8da');
                        button.css('border-color', '#4c8bf7').css('background', '#4c8bf7');
                        // удаляем класс с ошибкой с кнопки
                        button.removeClass('true_error_message');

                        // иначе, если select не изменен, но textarea не соответствует условию
                    } else if (textarea.val().length < self.close_task_length &&
                        selectButton.text() !== 'Выбрать результат') {

                        selectButton.css('border-color', '#d7d8da');
                        button.css('border-color', '#f37575').css('background', '#f57d7d');
                        // добавляем класс с ошибкой к кнопке
                        button.addClass('true_error_message');
                    }
                });
            });

            // возвращаем цвет textarea и/или кнопки в случае успеха
            textarea.bind('input', function () {
                // если длина textarea меньше допустимой
                if (textarea.val().trim().length < self.close_task_length) {

                    textarea.css('border-color', '#f37575');
                    button.css('border-color', '#f37575').css('background', '#f57d7d');
                    // добавляем класс с ошибкой к кнопке
                    button.addClass('true_error_message');

                    // иначе, если textarea соответствует условию и select изменен
                } else if (textarea.val().length >= self.close_task_length &&
                    selectButton.text() !== 'Выбрать результат') {

                    textarea.css('border-color', '#d7d8da');
                    button.css('border-color', '#4c8bf7').css('background', '#4c8bf7');
                    // удаляем класс с ошибкой с кнопки
                    button.removeClass('true_error_message');

                    // иначе, если textarea соответствует условию, но select не изменен
                } else if (textarea.val().length >= self.close_task_length &&
                    selectButton.text() === 'Выбрать результат') {

                    textarea.css('border-color', '#d7d8da');
                    button.css('border-color', '#f37575').css('background', '#f57d7d');
                    // добавляем класс с ошибкой к кнопке
                    button.addClass('true_error_message');
                }
            });
        }

        // функция добавления select в форму закрытия задачи
        this.addSelectCloseTask = function (task_id = null) {
            // данные и шаблон select'a
            var m_data = [
                {option: 'Выбрать результат'},
                {option: 'Новая заявка'},
                {option: 'Дорого'},
                {option: 'Клиент хотел другой товар'},
                {option: 'Хочет бесплатно'},
                {option: 'Неподходящий возраст'},
                {option: 'Не отвечает после контакта (3 дня подряд)'},
                {option: 'Нет денег'},
                {option: 'Передумал до звонка'},
                {option: 'Несовершеннолетний'},
                {option: 'Нет причины'},
                {option: 'Хотел другой продукт'},
                {option: 'Хулиганство'},
                {option: 'Беременные / кормящие'},
                {option: 'Онкология'},
                {option: 'Выключен'},
                {option: 'Нет ответа клиента'},
                {option: 'Неправильный номер телефона'},
                {option: 'Ожидает предоплату'},
                {option: 'Перезвонить'},
                {option: 'Перезвонить клиенту'},
                {option: 'Перезвонить и выяснить ответ'},
                {option: 'Не дозвонился 3 дня подряд'}
            ];

            var data = self.render(
                { ref: '/tmpl/controls/select.twig' },
                { items: m_data, class_name: 'close_task_select' }
            );

            // абсолютный, для карточек
            var dataHidden = self.render(
                { ref: '/tmpl/controls/select.twig' },
                { items: m_data, class_name: 'close_task_select-hidden' }
            );

            var taskWrapper, select, selectHidden;

            // если в задачах
            if (AMOCRM.getBaseEntity() === 'todo') {
                taskWrapper = $('div.card-task .card-task__result-wrapper__inner');
                select = $('div.card-task .close_task_select');

                // если select отсутствет, добавляем, придаем стили
                if (!select.length) taskWrapper.prepend(data);

                select.css({
                    'width': 'auto',
                    'max-width': '170px',
                    'margin-right': '10px'
                });
            }

            // если в карточке
            if (AMOCRM.isCard() === true) {
                selectHidden = $('div.card-holder .close_task_select-hidden');

                // если select-hidden отсутствет, добавляем, придаем стили
                if (!selectHidden.length) $('div.card-holder').append(dataHidden);

                // если передан ID конкретной задачи, добавляем select в нее
                if (task_id) {
                    taskWrapper = $(`div[data-id="${ task_id }"] .card-task__result-wrapper__inner`);
                    select = $(`div[data-id="${ task_id }"] .close_task_select`);

                    // если select отсутствет, добавляем
                    if (!select.length) taskWrapper.prepend(data);
                }
            }
        }

        // функиця вызова всплывающих сообщений над кнопкой
        this.getTemplate = function (template, params, callback) {
            params = (typeof params == 'object') ? params : {};
            template = template || '';

            return self.render({
                href: '/templates/' + template + '.twig',
                base_path: self.params.path,
                load: callback
            }, params);
        };

        // функция проверки на число из настроек виджета, иначе 0
        this.closeTaskToNumber = function () {
            self.set_settings({ close_task: parseInt(self.get_settings().close_task) });
            if (!Number.isInteger(self.get_settings().close_task)) self.set_settings({ close_task: 0 });
            self.close_task_length = self.get_settings().close_task;
        }

        this.callbacks = {
            settings: function () {
                // преобразуем системную переменну в число и выводим в настройки
                var closeTaskInput = $('input[name="close_task"]');
                self.closeTaskToNumber();
                closeTaskInput.val(self.close_task_length);

                // если виджет не установлен, обнуляем значение из настроек
                if (self.get_install_status() === 'not_configured') {
                    self.set_settings({ close_task: 0 });
                    self.close_task_length = null;
                    closeTaskInput.val(0);
                }

                editSelect();

                var selectItems = self.get_settings().selectItem || [];
                if (selectItems !== 'string') selectItems = JSON.stringify(selectItems);
                selectItems = JSON.parse(selectItems);
                console.log(selectItems);
                console.log(self.get_settings().selectItem);

                $('input[name="selectItem"]').val(JSON.stringify(selectItems));
                $('input[name="selectItem"]').trigger('change');
            },
            init: function () {
                return true;
            },
            bind_actions: function () {
                // запускаем прослушку элементов
                self.observerCreateTasks.observe($('body')[0], {
                    childList: true,
                    subtree: true,
                    attributes: true
                });

                self.observerAddSelect.observe($('body')[0], {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class']
                });

                return true;
            },
            render: function () {
                // в случае перезагрузки страницы или изменения значения
                if (self.close_task_length === null) self.closeTaskToNumber();

                // template только для задач и карточек
                if (AMOCRM.getBaseEntity() === 'todo' || AMOCRM.isCard() === true) {
                    // сообщение об ошибке на кнопке закрытия задачи
                    self.getTemplate('close_error_message_tasks', {}, function (template) {
                        // добавляем элемент на страницу
                        var errorMessage = template.render();
                        if (!$('body .close_error_message_tasks').length) $('body').append(errorMessage);
                    });

                    // сообщение об ошибке на кнопке создания задачи
                    self.getTemplate('create_error_message_tasks', {}, function (template) {
                        // добавляем элемент на страницу
                        var errorMessage = template.render();
                        if (!$('body .create_error_message_tasks').length) $('body').append(errorMessage);
                    });
                }

                return true;
            },
            dpSettings: function () {},
            advancedSettings: function () {},
            destroy: function () {
                // останавливаем прослушку элементов
                self.observerCreateTasks.disconnect();
                self.observerAddSelect.disconnect();
            },
            contacts: {
                selected: function () {}
            },
            onSalesbotDesignerSave: function (handler_code, params) {},
            leads: {
                selected: function () {}
            },
            todo: {
                selected: function () {},
            },
            onSave: function () {
                // записываем новое значение в системную переменную
                $('input[name="close_task-hidden"]').trigger('change');
                // обнуляем для рендера
                self.close_task_length = null;

                return true;
            },
            onAddAsSource: function (pipeline_id) {}
        };
        return this;
    };
    return CustomWidget;
});
