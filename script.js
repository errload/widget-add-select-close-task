define(['jquery', 'underscore', 'twigjs'], function ($, _, Twig) {
    var CustomWidget = function () {
        var self = this,
            system = self.system(),
            langs = self.langs,
            task_id = 0; // ID задачи

        // количество символов для закрытия и создания задач
        this.close_task_length = null;
        this.create_task_length = 3;
        this.taskClosed = false; // для ajax запроса
        this.taskIDChanged = null;

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
                            var selectButton = $('.close_task_select .control--select--button');

                            select.css('margin-top', '1px');
                            selectUl.css({
                                'width': 'auto',
                                'min-width': selectButton.outerWidth() - 13,
                                'margin-left': '13px'
                            });

                            // // закрытие задачи
                            self.closeTasks();
                            self.task_id = null;
                            return false;
                        }
                    }
                });
            }

            if (AMOCRM.isCard() === true) {
                // функция перебора существующих задач и вставки в них select'а
                const addCardSelect = function () {
                    $.each($('div.card-task'), function () {
                        self.task_id = $(this).find('.card-task__button').attr('id');

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

                        self.task_id = null;
                    });
                    return false;
                }

                // для просроченных открытых задач добавялем select'ы
                $(document).ready(addCardSelect());

                // при изменении классов (открытие, закрытие, скролл задач) обновляем select'ы
                $.each(mutationsList, function () {
                    if (this.type === 'attributes') {
                        addCardSelect();

                        var selectButtonSpan, selectButton = $('div.card-task .control--select--button');
                        var selectHidden = $('div.close_task_select-hidden');
                        var selectButtonHidden = $('div.close_task_select-hidden button');
                        var selectUlHidden = $('div.close_task_select-hidden ul');
                        var selectLiHidden = $('div.close_task_select-hidden li');
                        var textarea = $('div.card-task textarea[name="result"]');

                        // отображаем пункты скрытого select'a при клике на select задачи
                        selectButton.unbind('click');
                        selectButton.bind('click', function (e) {
                            e.stopPropagation();

                            self.task_id = $(e.target).closest('div.feed-note-wrapper-task').attr('data-id');
                            var select = $(`div[data-id="${ self.task_id }"] .close_task_select`);
                            selectButtonSpan = $(`div[data-id="${ self.task_id }"] .control--select--button-inner`);
                            // добавляем аттрибут ID задачи к скрытому select'у
                            selectHidden.attr('data-id', self.task_id);

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
                            selectUlHidden.css({
                                'width': 'auto',
                                'z-index': '30',
                                'min-width': selectButtonHidden.outerWidth() - 13,
                                'margin-left': '13px'
                            });
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
                            var task_id = $(e.target).closest('.close_task_select-hidden').attr('data-id');
                            selectButtonSpan = $(`div[data-id="${ task_id }"] .control--select--button-inner`);
                            selectButtonSpan.text($(e.target).text());

                            selectUlHidden.css('width', 'auto');
                            selectUlHidden.removeClass('control--select--list-opened');
                            selectUlHidden.addClass('control--select--list');
                        });

                        // обнуляем textarea при несоответствии проверки
                        textarea.unbind('change');
                        textarea.bind('change', function (e) {
                            var task_id = $(e.target).closest('div.feed-note-wrapper-task').attr('data-id');
                            textarea = $(`div[data-id="${ task_id }"] textarea[name="result"]`);
                            selectButton = $(`div.feed-note-wrapper-task[data-id="${ task_id }"] .control--select--button`);

                            if (textarea.val().trim().length < self.close_task_length ||
                                (textarea.val().trim().length > self.close_task_length &&
                                    selectButton.text() === 'Выбрать результат')) {
                                textarea.val('');
                            } else {
                                if (textarea.val() !== selectButton.text()) {
                                    textarea.val(selectButton.text() + ': ' + textarea.val());
                                    self.taskClosed = true;
                                    self.taskIDChanged = task_id;
                                }
                            }
                        });

                        // закрываем select при прокрутке разных элементов
                        const selectCSS = function () {
                            if (selectHidden.css('display') == 'none') return false;
                            selectHidden.css('display', 'none');
                            selectUlHidden.removeClass('control--select--list-opened');
                            selectUlHidden.addClass('control--select--list');
                            return false;
                        }

                        $('.card-holder__feed .notes-wrapper__scroller').scroll(selectCSS);
                        $('div.card-holder__feed .notes-wrapper__tasks-inner').scroll(selectCSS);

                        // закрываем select при клике вне select'a
                        $(document).click(function (e) {
                            if (!$(e.target).closest('.close_task_select-hidden').length) selectCSS();
                        });

                        // закрытие задачи
                        self.closeTasks();
                        // отдельный ajax для события textarea change, иначе ajax по клику на кнопке
                        if (self.taskIDChanged) self.sendAjax(self.taskIDChanged);
                        self.task_id = null;
                        return false;
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
                setTimeout(() => $.ajax({
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
                }), 2000);
            }
            self.taskClosed = false;
        }

        // функция закрытия задачи с проверкой по ID
        this.closeTasks = function () {
            $('div.card-task .card-task__button').unbind('click');
            $('div.card-task .card-task__button').bind('click', function (e) {
                var task_id;

                // в задачах и карточке расположение ID задачи разное
                if (AMOCRM.getBaseEntity() === 'todo') task_id = $(e.target).closest('div.todo-form').attr('data-id');
                else if (AMOCRM.isCard() === true) task_id = $(e.target).closest('div.feed-note-wrapper-task').attr('data-id');

                var button = $(`div[data-id="${ task_id }"] .card-task__button`);
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
                self.sendAjax(task_id);
            });
        }

        // функция показа сообщения об ошибке
        this.showErrorMessageTask = function (task_type, button, task_id = null) {
            var errorMessage = $(`div.${ task_type }_error_message_tasks`);
            var left, top, buttonMessage;

            if (!task_id) buttonMessage = $('div.feed-compose .true_error_message');
            else buttonMessage = $(`div[data-id="${ task_id }"] .true_error_message`);

            // отображаем сообщение
            errorMessage.css('display', 'block');

            // позиционируем относительно кнопки
            var resize = function () {
                if (task_type === 'create') left = buttonMessage.offset().left;
                else left = buttonMessage.offset().left - errorMessage.outerWidth() + button.outerWidth();

                if (button.offset().top > 100) top = buttonMessage.offset().top - errorMessage.outerHeight() - 30;
                else top = buttonMessage.offset().top + button.outerHeight() + 30;

                errorMessage.offset({
                    left: left,
                    top: top
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
            var selectButton, button = $(`div[data-id="${ task_id }"] .card-task__button`);
            var textarea = $(`div[data-id="${ task_id }"] textarea[name="result"]`);

            // в задачах и карточке расположение select'a разное
            if (AMOCRM.isCard() === true) selectButton = $(`div.feed-note-wrapper-task[data-id="${ task_id }"] .control--select--button`);
            else if (AMOCRM.getBaseEntity() === 'todo') selectButton = $(`div.todo-form[data-id="${ task_id }"] .control--select--button`);

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
            var m_data = [], items = self.get_settings().selectItems || [];
            typeof items !== 'string' ? items = JSON.parse(JSON.stringify(items)) : items = JSON.parse(items);
            $.each(items, function () { m_data.push(this) });

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

        // функция редактирования списков результатов задач
        this.editSelect = function () {
            // массив/объект с get_settings(), преобразуем в массив
            var selectItems = [], items = self.get_settings().selectItems || [];
            typeof items !== 'string' ? items = JSON.parse(JSON.stringify(items)) : items = JSON.parse(items);
            $.each(items, function () { selectItems.push(this) });

            // функция обновления get_settings()
            const settingsUpdate = function () {
                $(`#${ self.get_settings().widget_code }_custom`).val(JSON.stringify(selectItems));
                $(`#${ self.get_settings().widget_code }_custom`).trigger('change');
            }

            // функция обновления selectItems и select'a
            const updateSelect = function () {
                // массив с новыми значениями
                var lastSelectItems = [];
                // перебор инпутов и запись в новый массив
                $.each($('.select__enums__input'), function () {
                    // удаляем пробелы до и после
                    option = $(this).val().trim();
                    // если инпут пустой, пропускаем
                    if (!option.length) return;
                    // если инпут с таким значением уже присутствует, пропускаем
                    if (lastSelectItems.includes(option)) return;
                    lastSelectItems.push(option);
                });

                // обнуляем текущий массив и добавляем значения инпутов
                selectItems = [];
                selectItems.push({ option: 'Выбрать результат' });
                $.each(lastSelectItems, function (index, item) { selectItems.push({ option: item }) });

                // обновляем items select
                $.each($('.close_task_select ul li'), function () { $(this).remove(); });
                $.each(selectItems, function (index, item) {
                    $('.close_task_select ul').append(`
                        <li data-value="${ item.option }" data-color class="control--select--list--item">
                            <span class="control--select--list--item-inner" title="${ item.option }">${ item.option }</span>
                        </li>
                    `);
                });

                // обновляем get_settings
                settingsUpdate();
                return selectItems;
            }

            // функция удаления элемента select
            const inputRemove = function (e) {
                // удаляем инпут и обновляем массив и select
                $(e.target).closest('.select__enums__item').remove();
                selectItems = updateSelect();
            }

            // функция добавления/редактирования элемента select
            const inputEdit = function (e) {
                var isValue = false,
                    option = $(e.target).val().trim(),
                    value = $(e.target).attr('value');

                // если инпут пустой, обнуляем поле и обновляем массив и select
                if (!option.length) $(e.target).val('');
                selectItems = updateSelect();
            }

            // функция добавления элемента input
            const addInput = function (option = '') {
                var input = Twig({ ref: '/tmpl/controls/input.twig' }).render({
                    name: 'select-item',
                    class_name: 'select__enums__input',
                    value: option,
                    placeholder: 'Вариант',
                    max_length: 50
                });

                // вставляем и ровняем инпут и кнопку удаления
                $('.select__enums__href').before(`
                    <div class="widget_settings_block__input_field select__enums__item" style="
                        margin-bottom: 4px;
                        width: 100%;
                        position: relative;
                    ">
                        <div class="cf-field-enum__remove" title="Удалить" style="width: auto;">
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
            }

            // если пустой, добавляем пункт title
            if (selectItems.length == 0) selectItems.unshift({ option: 'Выбрать результат' });

            // вставляем и ровняем select и заголовок
            var select = Twig({ ref: '/tmpl/controls/select.twig' }).render({
                items: selectItems, class_name: 'close_task_select'
            });
            $('.widget_settings_block__controls').before(select);
            $('.close_task_select').before(`
                <div class="widget_settings_block__title_field" style="martin-top: 10px;">
                    Список результатов задач
                </div>
            `);
            $('.close_task_select').css('margin-bottom', '4px');
            $('.close_task_select .control--select--button').css('width', '278px');
            $('.close_task_select ul').css({
                'width': 'auto',
                'min-width': '265px',
                'max-width': $('.view-integration-modal__tabs').outerWidth(),
                'margin-left': '13px'
            });

            // ссылка для добавления инпута
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
                    ">Добавить вариант</span>
                </div>
            `);

            // если записей нет, добавляем 5 пустых полей
            if (selectItems.length <= 1) for (var i = 0; i < 5; i++) addInput();

            // перебор select items для инпутов редактирования и удаления
            $.each(selectItems, function (index, item) {
                if (item.option == 'Выбрать результат') return;
                addInput(item.option);
            });

            // добавляем к созданным инпутам функции удаления и создания/редактирования
            $.each($('.cf-field-enum__remove'), function () { $(this).bind('click', inputRemove) });
            $.each($('.select__enums__input'), function () { $(this).bind('change', inputEdit) });

            // клик по ссылке, вставляем и ровняем инпут
            $('.select__enums__href').unbind('click');
            $('.select__enums__href').bind('click', function () {
                // если последней инпут не заполнен, новый не добавляем
                var lastInput = $('.select__enums__input').last();
                if (lastInput.length) {
                    if (!lastInput.val().trim()) {
                        lastInput.focus();
                        return;
                    }
                }

                addInput();
                // удаляем запись из массива, обновляем get_settings()
                $('.cf-field-enum__remove').bind('click', inputRemove);
                // добавляем запись в массив, обновляем get_settings()
                $('.select__enums__input').bind('change', inputEdit);
            });
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

                // добавляем редактирование списка результатов задач
                self.editSelect();

                var selectItems = [], items = self.get_settings().selectItems || [];
                typeof items !== 'string' ? items = JSON.parse(JSON.stringify(items)) : items = JSON.parse(items);
                $.each(items, function () { selectItems.push(this) });

                $(`#${ self.get_settings().widget_code }_custom`).val(JSON.stringify(selectItems));
                $(`#${ self.get_settings().widget_code }_custom`).trigger('change');
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
