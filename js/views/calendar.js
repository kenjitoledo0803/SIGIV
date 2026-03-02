export class CalendarView {
    constructor(store) {
        this.store = store;
        this.currentDate = new Date();
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 = Sunday

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        // Fetch Events (Consolidations with Plant Arrival)
        const consolidations = this.store.getAll('consolidations').filter(c => c.plantArrivalDate);

        // Map events to days
        const eventsByDay = {};
        consolidations.forEach(c => {
            // Handle both YYYY-MM-DD and YYYY-MM-DD HH:mm:ss
            let dateStr = c.plantArrivalDate;
            if (!dateStr.includes('T') && !dateStr.includes(':')) {
                dateStr += 'T00:00:00';
            } else {
                dateStr = dateStr.replace(' ', 'T');
            }

            const date = new Date(dateStr);
            if (date.getMonth() === month && date.getFullYear() === year) {
                const day = date.getDate();
                if (!eventsByDay[day]) eventsByDay[day] = [];
                eventsByDay[day].push({ ...c, parsedDate: date });
            }
        });

        // Generate Calendar Grid
        let calendarHTML = '';
        let day = 1;

        // Header Row (Days of Week)
        const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        let headerRow = weekDays.map(d => `<div style="font-weight: 600; color: var(--text-secondary); text-align: center; padding: 0.5rem;">${d}</div>`).join('');

        // Days Grid
        for (let i = 0; i < 6; i++) { // Max 6 rows
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < startingDay) {
                    calendarHTML += `<div style="padding: 1rem; border: 1px solid var(--border-color); background: var(--bg-body);"></div>`;
                } else if (day > daysInMonth) {
                    calendarHTML += `<div style="padding: 1rem; border: 1px solid var(--border-color); background: var(--bg-body);"></div>`;
                } else {
                    const events = eventsByDay[day] || [];
                    const eventsHTML = events.map(e => {
                        const timeStr = e.parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                        const showTime = timeStr !== '00:00' && timeStr !== '24:00';
                        return `
                        <a href="#consolidations/${e.id}" style="display: block; background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-top: 4px; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${showTime ? `<strong>${timeStr}</strong> ` : ''}${e.reference}
                        </a>
                        `;
                    }).join('');

                    calendarHTML += `
                        <div style="padding: 0.5rem; border: 1px solid var(--border-color); min-height: 100px; background: white;">
                            <div style="font-weight: 600; margin-bottom: 0.25rem;">${day}</div>
                            ${eventsHTML}
                        </div>
                    `;
                    day++;
                }
            }
            if (day > daysInMonth) break;
        }

        return `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0;">Calendario de Entregas</h2>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <button id="btn-prev-month" class="btn-icon"><span class="material-icons-round">chevron_left</span></button>
                        <span style="font-size: 1.25rem; font-weight: 600; min-width: 150px; text-align: center;">${monthNames[month]} ${year}</span>
                        <button id="btn-next-month" class="btn-icon"><span class="material-icons-round">chevron_right</span></button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0;">
                    ${headerRow}
                    ${calendarHTML}
                </div>
            </div>
        `;
    }

    attachEvents() {
        document.getElementById('btn-prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.refresh();
        });

        document.getElementById('btn-next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.refresh();
        });
    }

    refresh() {
        const container = document.getElementById('view-container');
        container.innerHTML = this.render();
        this.attachEvents();
    }
}
