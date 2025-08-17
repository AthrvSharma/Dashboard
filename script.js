document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    // Generic Modal elements
    let modalSaveBtn = document.getElementById('modal-save-btn');
    let modalCancelBtn = document.getElementById('modal-cancel-btn');
    const genericModal = document.getElementById('generic-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    // Confirmation Modal elements
    const confirmModal = document.getElementById('confirm-modal');
    let confirmActionBtn = document.getElementById('confirm-action-btn');
    let confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const confirmModalTitle = document.getElementById('confirm-modal-title');
    const confirmModalMessage = document.getElementById('confirm-modal-message');

    // Settings Modal elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsModalCloseBtn = document.getElementById('settings-modal-close-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    // Profile Picture elements
    const profilePicUpload = document.getElementById('profile-pic-upload');
    const profilePic = document.getElementById('profile-pic');

    // --- Data Storage (Client-side, using localStorage for persistence) ---
    // Helper function to safely parse JSON from localStorage
    function getLocalData(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`Error parsing localStorage key "${key}":`, e);
            return defaultValue; // Return default value on error
        }
    }

    // Initialize application data from localStorage or with default values
    let clients = getLocalData('clients', [
        { id: 'cli_001', name: 'Acme Corp', contact: 'John Doe', lastInteraction: '2025-08-15', status: 'Active' },
        { id: 'cli_002', name: 'Globex Inc.', contact: 'Jane Smith', lastInteraction: '2025-08-10', status: 'Pending' },
    ]);
    let jobs = getLocalData('jobs', [
        { id: 'job_001', title: 'Office Renovation', client: 'Acme Corp', status: 'In Progress', dueDate: '2025-09-30' },
        { id: 'job_002', title: 'Retail Store Setup', client: 'Globex Inc.', status: 'Completed', dueDate: '2025-07-20' },
    ]);
    let quotes = getLocalData('quotes', [
        { id: 'quo_001', client: 'Acme Corp', amount: 15000, status: 'Pending', createdDate: '2025-08-01' },
        { id: 'quo_002', client: 'Globex Inc.', amount: 10000, status: 'Accepted', createdDate: '2025-07-15' },
    ]);
    let services = getLocalData('services', [
        { id: 'serv_001', name: 'Interior Design' },
        { id: 'serv_002', name: 'Construction Management' },
        { id: 'serv_003', name: 'Consultation' },
    ]);
    let calendarEvents = getLocalData('calendarEvents', [
        { id: 'event_001', title: 'Team Meeting', start: '2025-08-20T10:00:00' },
        { id: 'event_002', title: 'Client Presentation', start: '2025-08-22T14:00:00' },
        { id: 'event_003', title: 'Project Deadline', start: '2025-08-25' }
    ]);
    let mapLocations = getLocalData('mapLocations', [
        { id: 'loc_001', name: 'Acme HQ', lat: 51.505, lon: -0.09, description: 'Main office of Acme Corp' },
        { id: 'loc_002', name: 'Globex Retail', lat: 51.515, lon: -0.12, description: 'New retail outlet for Globex Inc.' }
    ]);
    let userSettings = getLocalData('userSettings', {
        userName: 'User',
        userEmail: 'User.p@example.com',
        theme: 'light',
        profilePicture: 'https://placehold.co/40x40/ADD8E6/000?text=JP' // Default placeholder
    });

    // Function to save all application data to localStorage
    function saveData() {
        localStorage.setItem('clients', JSON.stringify(clients));
        localStorage.setItem('jobs', JSON.stringify(jobs));
        localStorage.setItem('quotes', JSON.stringify(quotes));
        localStorage.setItem('services', JSON.stringify(services));
        localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
        localStorage.setItem('mapLocations', JSON.stringify(mapLocations));
        localStorage.setItem('userSettings', JSON.stringify(userSettings)); // Save user settings
        updateDashboardMetrics(); // Always update dashboard metrics after data changes
    }

    // --- Section Management ---
    // Function to show a specific content section and update sidebar active state
    function showSection(sectionId) {
        // Hide all content sections
        contentSections.forEach(section => {
            section.classList.add('hidden');
        });

        // Show the selected section
        const targetSection = document.getElementById(sectionId + '-section');
        if (targetSection) {
            targetSection.classList.remove('hidden');
            // Initialize specific section features when they become visible
            if (sectionId === 'calendar') {
                initCalendar();
            } else if (sectionId === 'map') {
                initMap();
                // Crucial fix: Invalidate map size after its container becomes visible
                // This forces Leaflet to recalculate its tiles and dimensions.
                // A small timeout ensures the DOM has rendered the map container visible.
                setTimeout(() => {
                    if (map) map.invalidateSize();
                }, 250);
                renderMapLocations(); // Also render the list of map locations
            } else if (sectionId === 'clients') {
                renderClients();
            } else if (sectionId === 'jobs') {
                renderJobs();
            } else if (sectionId === 'quotes') {
                renderQuotes();
            } else if (sectionId === 'myservices') {
                renderServices();
            }
        }

        // Update active class on navigation links for visual feedback
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Attach click event listeners to all sidebar navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default anchor link behavior
            const sectionId = link.dataset.section; // Get section ID from data-section attribute
            showSection(sectionId);
        });
    });

    // --- Generic Modals (for Add/Edit forms) ---
    // Function to open a generic modal with dynamic content and a save callback
    function openModal(title, bodyHtml, saveCallback) {
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHtml;
        genericModal.classList.remove('hidden');

        const handleSave = () => {
            saveCallback(); // Execute the specific save logic provided by the caller
            // The saveCallback is responsible for closing the modal after successful validation
        };

        // Clone buttons to remove all existing event listeners and re-attach new ones
        // This prevents multiple event listeners from accumulating on modal buttons
        const oldModalSaveBtn = modalSaveBtn;
        const oldModalCancelBtn = modalCancelBtn;
        modalSaveBtn = oldModalSaveBtn.cloneNode(true);
        modalCancelBtn = oldModalCancelBtn.cloneNode(true);
        oldModalSaveBtn.replaceWith(modalSaveBtn);
        oldModalCancelBtn.replaceWith(modalCancelBtn);

        // Add new event listeners to the cloned buttons
        modalSaveBtn.addEventListener('click', handleSave);
        modalCancelBtn.addEventListener('click', closeModal);
    }

    // Function to close the generic modal
    function closeModal() {
        genericModal.classList.add('hidden');
        modalBody.innerHTML = ''; // Clear modal content for next use
        // If the map modal was open, remove its temporary click listener to prevent conflicts
        if (map) {
            map.off('click', tempMapClickListener);
        }
    }

    // Attach event listeners for closing the generic modal
    modalCloseBtn.addEventListener('click', closeModal);
    genericModal.addEventListener('click', (event) => {
        if (event.target === genericModal) { // Close if clicked on the overlay background
            closeModal();
        }
    });

    // --- Confirmation Modal (for Delete actions and user feedback) ---
    // Function to show a confirmation modal with a message and a callback
    function showConfirmModal(title, message, callback) {
        confirmModalTitle.textContent = title;
        confirmModalMessage.textContent = message;
        confirmModal.classList.remove('hidden');

        // Clone buttons to remove all existing event listeners and re-attach new ones
        const oldConfirmActionBtn = confirmActionBtn;
        const oldConfirmCancelBtn = confirmCancelBtn;
        confirmActionBtn = oldConfirmActionBtn.cloneNode(true);
        confirmCancelBtn = oldConfirmCancelBtn.cloneNode(true);
        oldConfirmActionBtn.replaceWith(confirmActionBtn);
        oldConfirmCancelBtn.replaceWith(confirmCancelBtn);

        // Add new event listeners to the cloned buttons
        confirmActionBtn.addEventListener('click', () => {
            callback(true); // Call callback with 'true' if confirmed
            hideConfirmModal();
        });
        confirmCancelBtn.addEventListener('click', () => {
            callback(false); // Call callback with 'false' if cancelled
            hideConfirmModal();
        });
    }

    // Function to hide the confirmation modal
    function hideConfirmModal() {
        confirmModal.classList.add('hidden');
    }

    // Attach event listener for closing the confirmation modal by clicking overlay
    confirmModal.addEventListener('click', (event) => {
        if (event.target === confirmModal) {
            hideConfirmModal();
        }
    });

    // --- Dashboard Metrics Update (Home Section) ---
    // Function to update the numerical and percentage values on the dashboard overview
    function updateDashboardMetrics() {
        const activeJobsCount = jobs.filter(job => job.status === 'Planned' || job.status === 'In Progress').length;
        const jobsInProgressCount = jobs.filter(job => job.status === 'In Progress').length;
        const finishedJobsCount = jobs.filter(job => job.status === 'Completed').length;
        const newLeadsCount = clients.filter(client => client.status === 'Pending').length; // Assuming 'Pending' clients are 'New Leads'

        document.getElementById('active-jobs-value').textContent = activeJobsCount + ' Jobs';
        document.getElementById('jobs-in-progress-value').textContent = jobsInProgressCount + ' Jobs';
        document.getElementById('finished-jobs-value').textContent = finishedJobsCount + ' Jobs';
        document.getElementById('new-leads-value').textContent = newLeadsCount + ' Leads';

        // Simple percentage calculation (can be enhanced with historical data for real accuracy)
        const totalJobs = jobs.length;
        document.getElementById('active-jobs-percentage').textContent = totalJobs > 0 ? `+${((activeJobsCount / totalJobs) * 100).toFixed(1)}%` : '0%';
        document.getElementById('jobs-in-progress-percentage').textContent = totalJobs > 0 ? `-${((jobsInProgressCount / totalJobs) * 100).toFixed(1)}%` : '0%'; // Example negative
        document.getElementById('finished-jobs-percentage').textContent = totalJobs > 0 ? `+${((finishedJobsCount / totalJobs) * 100).toFixed(1)}%` : '0%';
        const totalClients = clients.length;
        document.getElementById('new-leads-percentage').textContent = totalClients > 0 ? `+${((newLeadsCount / totalClients) * 100).toFixed(1)}%` : '0%';
    }

    // --- Calendar Functionality (FullCalendar.js Integration) ---
    let calendar; // Global variable to hold the FullCalendar instance
    function initCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return; // Exit if calendar element is not found

        if (calendar) { // Destroy existing calendar instance if already initialized
            calendar.destroy();
        }

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', // Default view
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay' // View options
            },
            events: calendarEvents, // Load events from our data array
            editable: true, // Allow events to be dragged and resized
            // Event triggered when an event is clicked
            eventClick: function(info) {
                const eventId = info.event.id;
                const event = calendarEvents.find(e => e.id === eventId);
                if (!event) return;

                openModal(
                    'Event Details',
                    `
                    <p class="mb-2"><strong>Title:</strong> ${event.title}</p>
                    <p class="mb-2"><strong>Start:</strong> ${new Date(event.start).toLocaleString()}</p>
                    ${event.end ? `<p><strong>End:</strong> ${new Date(event.end).toLocaleString()}</p>` : ''}
                    <div class="mt-4 flex justify-end">
                        <button id="delete-calendar-event-btn" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200">Delete Event</button>
                    </div>
                    `,
                    () => { /* No save action for view-only modal */ }
                );

                // Attach delete listener to the button inside the modal
                document.getElementById('delete-calendar-event-btn').onclick = () => {
                    showConfirmModal('Delete Event', 'Are you sure you want to delete this event?', (confirmed) => {
                        if (confirmed) {
                            calendarEvents = calendarEvents.filter(e => e.id !== eventId); // Remove from data array
                            saveData(); // Save updated data
                            calendar.getEventById(eventId).remove(); // Remove from calendar instance
                            closeModal(); // Close event details modal after deletion
                        }
                    });
                };
            },
            // Event triggered when an event is dragged to a new position
            eventDrop: function(info) {
                const eventIndex = calendarEvents.findIndex(e => e.id === info.event.id);
                if (eventIndex !== -1) {
                    calendarEvents[eventIndex].start = info.event.start.toISOString();
                    calendarEvents[eventIndex].end = info.event.end ? info.event.end.toISOString() : null;
                    saveData(); // Save changes after drag
                }
            },
            // Event triggered when an event is resized
            eventResize: function(info) {
                 const eventIndex = calendarEvents.findIndex(e => e.id === info.event.id);
                if (eventIndex !== -1) {
                    calendarEvents[eventIndex].start = info.event.start.toISOString();
                    calendarEvents[eventIndex].end = info.event.end ? info.event.end.toISOString() : null;
                    saveData(); // Save changes after resize
                }
            }
        });
        calendar.render(); // Render the calendar
    }

    // Event listener for "Add New Event" button
    document.getElementById('add-event-btn').addEventListener('click', () => {
        openModal(
            'Add New Event',
            `
            <label for="event-title" class="block text-gray-700 text-sm font-bold mb-2">Event Title:</label>
            <input type="text" id="event-title" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" placeholder="e.g., Team Meeting">

            <label for="event-start" class="block text-gray-700 text-sm font-bold mb-2">Start Date/Time:</label>
            <input type="datetime-local" id="event-start" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4">

            <label for="event-end" class="block text-gray-700 text-sm font-bold mb-2">End Date/Time (Optional):</label>
            <input type="datetime-local" id="event-end" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            `,
            () => { // Save callback for adding event
                const titleInput = document.getElementById('event-title');
                const startInput = document.getElementById('event-start');
                const endInput = document.getElementById('event-end');

                const title = titleInput.value.trim();
                const start = startInput.value;
                const end = endInput.value;

                if (title && start) {
                    const newEvent = {
                        id: `event_${Date.now()}`, // Unique ID for new event
                        title,
                        start,
                        end: end || null // Use null if end is empty
                    };
                    calendarEvents.push(newEvent); // Add to data array
                    saveData(); // Save data to localStorage
                    calendar.addEvent(newEvent); // Add to current calendar instance
                    closeModal(); // Close modal on successful addition
                } else {
                    showConfirmModal('Input Error', 'Please provide at least a title and start date/time for the event.', () => {});
                }
            }
        );
    });

    // --- Map Functionality (Leaflet.js Integration) ---
    let map; // Global variable to hold the Leaflet map instance
    let tempMapClickListener = null; // Global variable for map click listener to allow removal

    function initMap() {
        const mapEl = document.getElementById('map');
        if (!mapEl) return;

        if (map) { // Destroy existing map instance if already initialized
            map.remove();
        }

        // Initialize map centered around a general area (e.g., London)
        map = L.map('map').setView([51.505, -0.09], 13);

        // Add OpenStreetMap tiles (no API key needed)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add existing markers from data array
        mapLocations.forEach(loc => {
            addMapMarker(loc);
        });

        // Clear previous map click listener if it exists to prevent duplicates
        if (tempMapClickListener) {
            map.off('click', tempMapClickListener);
        }
        // Add new map click listener for adding locations dynamically
        tempMapClickListener = function(e) {
            const { lat, lng } = e.latlng;
            showConfirmModal(
                'Add Location Here?',
                `Do you want to add a new location at Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}?`,
                (confirmed) => {
                    if (confirmed) {
                        openModal(
                            'Add New Map Location Details',
                            `
                            <label for="location-name" class="block text-gray-700 text-sm font-bold mb-2">Location Name:</label>
                            <input type="text" id="location-name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" placeholder="e.g., Client Office">

                            <label for="location-lat" class="block text-gray-700 text-sm font-bold mb-2">Latitude:</label>
                            <input type="number" step="any" id="location-lat" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" value="${lat.toFixed(6)}" readonly>

                            <label for="location-lon" class="block text-gray-700 text-sm font-bold mb-2">Longitude:</label>
                            <input type="number" step="any" id="location-lon" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" value="${lng.toFixed(6)}" readonly>

                            <label for="location-desc" class="block text-gray-700 text-sm font-bold mb-2">Description (Optional):</label>
                            <textarea id="location-desc" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24" placeholder="Details about this location..."></textarea>
                            `,
                            () => { // Save callback for adding map location
                                const name = document.getElementById('location-name').value.trim();
                                const description = document.getElementById('location-desc').value.trim();

                                if (name) {
                                    const newLoc = { id: `loc_${Date.now()}`, name, lat, lon: lng, description };
                                    mapLocations.push(newLoc); // Add to data array
                                    saveData(); // Save data to localStorage
                                    addMapMarker(newLoc); // Add marker to map
                                    renderMapLocations(); // Update the list of locations below the map
                                    closeModal(); // Close the input modal after saving
                                } else {
                                    showConfirmModal('Input Error', 'Please provide a name for the location.', () => {});
                                }
                            }
                        );
                    }
                }
            );
        };
        map.on('click', tempMapClickListener); // Attach map click listener
    }

    // Function to add a single marker to the Leaflet map
    function addMapMarker(loc) {
        const marker = L.marker([loc.lat, loc.lon], { draggable: true, id: loc.id }).addTo(map)
            .bindPopup(`<b>${loc.name}</b><br>${loc.description || 'No description'}`);

        // Event listener for when a marker is dragged
        marker.on('dragend', function(e) {
            const { lat, lng } = e.target.getLatLng();
            const index = mapLocations.findIndex(l => l.id === e.target.options.id);
            if (index !== -1) {
                mapLocations[index].lat = lat;
                mapLocations[index].lon = lng;
                saveData(); // Save updated coordinates
                e.target.setPopupContent(`<b>${mapLocations[index].name}</b><br>${mapLocations[index].description || 'No description'}<br><small>Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}</small>`);
                renderMapLocations(); // Update the list below the map
            }
        });

        // Event listener for when a marker popup is opened
        marker.on('popupopen', function() {
            const locId = this.options.id;
            const loc = mapLocations.find(l => l.id === locId);
            if (loc) {
                const popupContent = `
                    <div class="space-y-2 text-gray-800">
                        <h4 class="font-bold text-lg">${loc.name}</h4>
                        <p class="text-sm">${loc.description || 'No description provided.'}</p>
                        <p class="text-xs text-gray-500">Lat: ${loc.lat.toFixed(4)}, Lon: ${loc.lon.toFixed(4)}</p>
                        <div class="flex justify-end space-x-2 mt-3">
                            <button class="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600 edit-map-loc-btn" data-id="${loc.id}">Edit</button>
                            <button class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 delete-map-loc-btn" data-id="${loc.id}">Delete</button>
                        </div>
                    </div>
                `;
                this.setPopupContent(popupContent);
                // Attach listeners to new buttons within the popup
                document.querySelector(`[data-id="${loc.id}"].edit-map-loc-btn`).onclick = () => handleEditMapLocation(loc.id);
                document.querySelector(`[data-id="${loc.id}"].delete-map-loc-btn`).onclick = () => handleDeleteMapLocation(loc.id);
            }
        });
        return marker;
    }

    // Function to handle editing a map location
    function handleEditMapLocation(id) {
        const loc = mapLocations.find(l => l.id === id);
        if (!loc) return;

        openModal(
            'Edit Map Location',
            `
            <label for="edit-location-name" class="block text-gray-700 text-sm font-bold mb-2">Location Name:</label>
            <input type="text" id="edit-location-name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" value="${loc.name}">

            <label for="edit-location-lat" class="block text-gray-700 text-sm font-bold mb-2">Latitude:</label>
            <input type="number" step="any" id="edit-location-lat" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" value="${loc.lat}" readonly>

            <label for="edit-location-lon" class="block text-gray-700 text-sm font-bold mb-2">Longitude:</label>
            <input type="number" step="any" id="edit-location-lon" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" value="${loc.lon}" readonly>

            <label for="edit-location-desc" class="block text-gray-700 text-sm font-bold mb-2">Description (Optional):</label>
            <textarea id="edit-location-desc" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24" placeholder="Details about this location...">${loc.description || ''}</textarea>
            `,
            () => { // Save callback for editing map location
                const newName = document.getElementById('edit-location-name').value.trim();
                const newDescription = document.getElementById('edit-location-desc').value.trim();

                if (newName) {
                    loc.name = newName;
                    loc.description = newDescription;
                    saveData(); // Save updated data
                    initMap(); // Re-render map to update marker popups and positions
                    renderMapLocations(); // Update the list below the map
                    closeModal(); // Close modal on successful update
                } else {
                    showConfirmModal('Input Error', 'Please provide a name for the location.', () => {});
                }
            }
        );
    }

    // Function to handle deleting a map location
    function handleDeleteMapLocation(id) {
        showConfirmModal(
            'Delete Location',
            'Are you sure you want to delete this map location?',
            (confirmed) => {
                if (confirmed) {
                    mapLocations = mapLocations.filter(l => l.id !== id); // Remove from data array
                    saveData(); // Save updated data
                    initMap(); // Re-render map to remove the marker
                    renderMapLocations(); // Update the list below the map
                }
            }
        );
    }

    // Event listener for "Clear All Markers" button
    document.getElementById('clear-map-markers-btn').addEventListener('click', () => {
         showConfirmModal(
            'Clear All Markers',
            'Are you sure you want to delete all map markers? This cannot be undone.',
            (confirmed) => {
                if (confirmed) {
                    mapLocations = []; // Clear data array
                    saveData(); // Save empty data
                    initMap(); // Re-render map to remove all markers
                    renderMapLocations(); // Update the list below the map
                }
            }
        );
    });

    // --- Render Map Locations List (below the map) ---
    // Function to dynamically render the list of saved map locations
    function renderMapLocations() {
        const listContainer = document.getElementById('map-locations-list');
        const noLocationsMessage = document.getElementById('no-map-locations-message');
        listContainer.innerHTML = ''; // Clear existing list items

        if (mapLocations.length === 0) {
            noLocationsMessage.classList.remove('hidden'); // Show "no locations" message
        } else {
            noLocationsMessage.classList.add('hidden'); // Hide "no locations" message
            mapLocations.forEach(loc => {
                const locDiv = document.createElement('div');
                locDiv.className = 'bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center';
                locDiv.innerHTML = `
                    <div class="mb-2 sm:mb-0">
                        <p class="font-semibold text-gray-800">${loc.name}</p>
                        <p class="text-sm text-gray-600">${loc.description || 'No description'}</p>
                        <p class="text-xs text-gray-500">Lat: ${loc.lat.toFixed(4)}, Lon: ${loc.lon.toFixed(4)}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button class="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600 edit-btn" data-id="${loc.id}" data-type="map-location">Edit</button>
                        <button class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 delete-btn" data-id="${loc.id}" data-type="map-location">Delete</button>
                    </div>
                `;
                listContainer.appendChild(locDiv);
            });
            // Re-attach CRUD listeners for map locations list items (important for dynamically added elements)
            document.querySelectorAll('#map-locations-list .edit-btn').forEach(button => {
                button.onclick = (event) => handleEditMapLocation(event.target.dataset.id);
            });
            document.querySelectorAll('#map-locations-list .delete-btn').forEach(button => {
                button.onclick = (event) => handleDeleteMapLocation(event.target.dataset.id);
            });
        }
    }

    // --- Clients Section (CRUD operations) ---
    // Function to dynamically render the clients table
    function renderClients() {
        const tableBody = document.getElementById('clients-table-body');
        const noClientsMessage = document.getElementById('no-clients-message');
        tableBody.innerHTML = ''; // Clear existing rows

        if (clients.length === 0) {
            noClientsMessage.classList.remove('hidden');
        } else {
            noClientsMessage.classList.add('hidden');
            clients.forEach(client => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td class="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">${client.name}</td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-600">${client.contact}</td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-600">${client.lastInteraction}</td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                            ${client.status}
                        </span>
                    </td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-900 mr-2 edit-btn" data-id="${client.id}" data-type="client">Edit</button>
                        <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${client.id}" data-type="client">Delete</button>
                    </td>
                `;
            });
        }
        addCrudListeners(); // Attach listeners after rendering (for edit/delete buttons)
    }

    // Event listener for "Add New Client" button
    document.getElementById('add-client-btn').addEventListener('click', () => {
        openModal(
            'Add New Client',
            `
            <label for="client-name" class="block text-gray-700 text-sm font-bold mb-2">Client Name:</label>
            <input type="text" id="client-name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" placeholder="e.g., New Client Co.">

            <label for="contact-person" class="block text-gray-700 text-sm font-bold mb-2">Contact Person:</label>
            <input type="text" id="contact-person" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" placeholder="e.g., Jane Doe">

            <label for="last-interaction" class="block text-gray-700 text-sm font-bold mb-2">Last Interaction:</label>
            <input type="date" id="last-interaction" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4">

            <label for="client-status" class="block text-gray-700 text-sm font-bold mb-2">Status:</label>
            <select id="client-status" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
            </select>
            `,
            () => { // Save callback for adding client
                const name = document.getElementById('client-name').value.trim();
                const contact = document.getElementById('contact-person').value.trim();
                const lastInteraction = document.getElementById('last-interaction').value;
                const status = document.getElementById('client-status').value;
                if (name && contact && lastInteraction && status) {
                    clients.push({ id: `cli_${Date.now()}`, name, contact, lastInteraction, status });
                    saveData(); // Save updated data
                    renderClients(); // Re-render clients table
                    closeModal(); // Close modal
                } else {
                    showConfirmModal('Input Error', 'Please fill all required fields for the client.', () => {});
                }
            }
        );
    });

    // --- Jobs Section (CRUD operations) ---
    // Function to dynamically render the jobs table
    function renderJobs() {
        const tableBody = document.getElementById('jobs-table-body');
        const noJobsMessage = document.getElementById('no-jobs-message');
        tableBody.innerHTML = ''; // Clear existing rows

        if (jobs.length === 0) {
            noJobsMessage.classList.remove('hidden');
        } else {
            noJobsMessage.classList.add('hidden');
            jobs.forEach(job => {
                const row = tableBody.insertRow();
                const statusColor = job.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : (job.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800');
                row.innerHTML = `
                    <td class="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">${job.id}</td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-600">${job.title}</td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-600">${job.client}</td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                            ${job.status}
                        </span>
                    </td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-600">${job.dueDate}</td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-900 mr-2 edit-btn" data-id="${job.id}" data-type="job">Edit</button>
                        <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${job.id}" data-type="job">Delete</button>
                    </td>
                `;
            });
        }
        addCrudListeners();
    }

    // Event listener for "Add New Job" button
    document.getElementById('add-job-btn').addEventListener('click', () => {
        const clientOptions = clients.length > 0 ? clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('') : '<option value="">No clients available</option>';
        openModal(
            'Add New Job',
            `
            <label for="job-title" class="block text-gray-700 text-sm font-bold mb-2">Job Title:</label>
            <input type="text" id="job-title" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" placeholder="e.g., Website Redesign">

            <label for="job-client" class="block text-gray-700 text-sm font-bold mb-2">Client:</label>
            <select id="job-client" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4">
                ${clientOptions}
            </select>

            <label for="job-status" class="block text-gray-700 text-sm font-bold mb-2">Status:</label>
            <select id="job-status" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4">
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
            </select>

            <label for="job-due-date" class="block text-gray-700 text-sm font-bold mb-2">Due Date:</label>
            <input type="date" id="job-due-date" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            `,
            () => { // Save callback for adding job
                const title = document.getElementById('job-title').value.trim();
                const client = document.getElementById('job-client').value;
                const status = document.getElementById('job-status').value;
                const dueDate = document.getElementById('job-due-date').value;
                if (title && client && status && dueDate) {
                    jobs.push({ id: `job_${Date.now()}`, title, client, status, dueDate });
                    saveData(); // Save updated data
                    renderJobs(); // Re-render jobs table
                    closeModal(); // Close modal
                } else {
                    showConfirmModal('Input Error', 'Please fill all required fields for the job.', () => {});
                }
            }
        );
    });

    // --- Quotes Section (CRUD operations) ---
    // Function to dynamically render the quotes table
    function renderQuotes() {
        const tableBody = document.getElementById('quotes-table-body');
        const noQuotesMessage = document.getElementById('no-quotes-message');
        tableBody.innerHTML = ''; // Clear existing rows

        if (quotes.length === 0) {
            noQuotesMessage.classList.remove('hidden');
        } else {
            noQuotesMessage.classList.add('hidden');
            quotes.forEach(quote => {
                const row = tableBody.insertRow();
                const statusColor = quote.status === 'Accepted' ? 'bg-green-100 text-green-800' : (quote.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800');
                row.innerHTML = `
                    <td class="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">${quote.id}</td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-600">${quote.client}</td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-600">$${quote.amount.toLocaleString()}</td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                            ${quote.status}
                        </span>
                    </td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-600">${quote.createdDate}</td>
                    <td class="py-4 px-4 whitespace-nowrap text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-900 mr-2 edit-btn" data-id="${quote.id}" data-type="quote">Edit</button>
                        <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${quote.id}" data-type="quote">Delete</button>
                    </td>
                `;
            });
        }
        addCrudListeners();
    }

    // Event listener for "Create New Quote" button
    document.getElementById('create-quote-btn').addEventListener('click', () => {
        const clientOptions = clients.length > 0 ? clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('') : '<option value="">No clients available</option>';
        openModal(
            'Create New Quote',
            `
            <label for="quote-client" class="block text-gray-700 text-sm font-bold mb-2">Client:</label>
            <select id="quote-client" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4">
                ${clientOptions}
            </select>

            <label for="quote-amount" class="block text-gray-700 text-sm font-bold mb-2">Amount ($):</label>
            <input type="number" id="quote-amount" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" placeholder="e.g., 15000">

            <label for="quote-status" class="block text-gray-700 text-sm font-bold mb-2">Status:</label>
            <select id="quote-status" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4">
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
            </select>

            <label for="quote-created-date" class="block text-gray-700 text-sm font-bold mb-2">Created Date:</label>
            <input type="date" id="quote-created-date" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            `,
            () => { // Save callback for creating quote
                const client = document.getElementById('quote-client').value;
                const amount = parseFloat(document.getElementById('quote-amount').value);
                const status = document.getElementById('quote-status').value;
                const createdDate = document.getElementById('quote-created-date').value;
                if (client && !isNaN(amount) && status && createdDate) {
                    quotes.push({ id: `quo_${Date.now()}`, client, amount, status, createdDate });
                    saveData(); // Save updated data
                    renderQuotes(); // Re-render quotes table
                    closeModal(); // Close modal
                } else {
                     showConfirmModal('Input Error', 'Please fill all required fields for the quote.', () => {});
                }
            }
        );
    });

    // --- My Services Section (CRUD operations) ---
    // Function to dynamically render the services grid
    function renderServices() {
        const servicesGrid = document.getElementById('services-grid');
        const noServicesMessage = document.getElementById('no-services-message');
        servicesGrid.innerHTML = ''; // Clear existing items

        if (services.length === 0) {
            noServicesMessage.classList.remove('hidden');
        } else {
            noServicesMessage.classList.add('hidden');
            services.forEach(service => {
                const serviceDiv = document.createElement('div');
                serviceDiv.className = 'bg-purple-50 p-6 rounded-lg border border-purple-200 text-purple-800 font-medium flex justify-between items-center';
                serviceDiv.innerHTML = `
                    <span>${service.name}</span>
                    <div>
                        <button class="text-indigo-600 hover:text-indigo-900 mr-2 edit-btn" data-id="${service.id}" data-type="service">Edit</button>
                        <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${service.id}" data-type="service">Delete</button>
                    </div>
                `;
                servicesGrid.appendChild(serviceDiv);
            });
        }
        addCrudListeners();
    }

    // Event listener for "Add New Service" button
    document.getElementById('add-service-btn').addEventListener('click', () => {
        openModal(
            'Add New Service',
            `
            <label for="service-name" class="block text-gray-700 text-sm font-bold mb-2">Service Name:</label>
            <input type="text" id="service-name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" placeholder="e.g., HVAC Installation">
            `,
            () => { // Save callback for adding service
                const name = document.getElementById('service-name').value.trim();
                if (name) {
                    services.push({ id: `serv_${Date.now()}`, name });
                    saveData(); // Save updated data
                    renderServices(); // Re-render services grid
                    closeModal(); // Close modal
                } else {
                    showConfirmModal('Input Error', 'Please provide a service name.', () => {});
                }
            }
        );
    });

    // --- CRUD (Create, Read, Update, Delete) Listeners for all sections ---
    // Function to attach edit and delete listeners to dynamically rendered buttons
    function addCrudListeners() {
        // Attach click listeners for 'Edit' buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.onclick = (event) => {
                const id = event.target.dataset.id;
                const type = event.target.dataset.type;
                handleEdit(id, type);
            };
        });

        // Attach click listeners for 'Delete' buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (event) => {
                const id = event.target.dataset.id;
                const type = event.target.dataset.type;
                showConfirmModal(
                    `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`, // Capitalize type for title
                    `Are you sure you want to delete this ${type}? This cannot be undone.`,
                    (confirmed) => { // Callback for confirmation modal
                        if (confirmed) {
                            // Filter out the deleted item based on its type
                            if (type === 'client') {
                                clients = clients.filter(c => c.id !== id);
                                renderClients();
                            } else if (type === 'job') {
                                jobs = jobs.filter(j => j.id !== id);
                                renderJobs();
                            } else if (type === 'quote') {
                                quotes = quotes.filter(q => q.id !== id);
                                renderQuotes();
                            } else if (type === 'service') {
                                services = services.filter(s => s.id !== id);
                                renderServices();
                            }
                            saveData(); // Save updated data after deletion
                        }
                    }
                );
            };
        });
    }

    // Function to handle editing an item (opens generic modal with pre-filled data)
    function handleEdit(id, type) {
        let item;
        let formHtml = '';
        let saveCallback = () => {};

        // Determine item type and build appropriate form HTML and save callback
        if (type === 'client') {
            item = clients.find(c => c.id === id);
            if (!item) return;
            formHtml = `
                <label for="edit-client-name" class="block text-gray-700 text-sm font-bold mb-2">Client Name:</label>
                <input type="text" id="edit-client-name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" value="${item.name}">

                <label for="edit-contact-person" class="block text-gray-700 text-sm font-bold mb-2">Contact Person:</label>
                <input type="text" id="edit-contact-person" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" value="${item.contact}">

                <label for="edit-last-interaction" class="block text-gray-700 text-sm font-bold mb-2">Last Interaction:</label>
                <input type="date" id="edit-last-interaction" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" value="${item.lastInteraction}">

                <label for="edit-client-status" class="block text-gray-700 text-sm font-bold mb-2">Status:</label>
                <select id="edit-client-status" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    <option value="Active" ${item.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Inactive" ${item.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            `;
            saveCallback = () => {
                const newName = document.getElementById('edit-client-name').value.trim();
                const newContact = document.getElementById('edit-contact-person').value.trim();
                const newLastInteraction = document.getElementById('edit-last-interaction').value;
                const newStatus = document.getElementById('edit-client-status').value;

                if (newName && newContact && newLastInteraction && newStatus) {
                    item.name = newName;
                    item.contact = newContact;
                    item.lastInteraction = newLastInteraction;
                    item.status = newStatus;
                    saveData();
                    renderClients();
                    closeModal();
                } else {
                    showConfirmModal('Input Error', 'Please fill all required fields for the client.', () => {});
                }
            };
        } else if (type === 'job') {
            item = jobs.find(j => j.id === id);
            if (!item) return;
            const clientOptions = clients.map(c => `<option value="${c.name}" ${item.client === c.name ? 'selected' : ''}>${c.name}</option>`).join('');
            formHtml = `
                <label for="edit-job-title" class="block text-gray-700 text-sm font-bold mb-2">Job Title:</label>
                <input type="text" id="edit-job-title" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" value="${item.title}">

                <label for="edit-job-client" class="block text-gray-700 text-sm font-bold mb-2">Client:</label>
                <select id="edit-job-client" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4">
                    ${clientOptions}
                </select>

                <label for="edit-job-status" class="block text-gray-700 text-sm font-bold mb-2">Status:</label>
                <select id="edit-job-status" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4">
                    <option value="Planned" ${item.status === 'Planned' ? 'selected' : ''}>Planned</option>
                    <option value="In Progress" ${item.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Completed" ${item.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    <option value="On Hold" ${item.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                </select>

                <label for="edit-job-due-date" class="block text-gray-700 text-sm font-bold mb-2">Due Date:</label>
                <input type="date" id="edit-job-due-date" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value="${item.dueDate}">
            `;
            saveCallback = () => {
                const newTitle = document.getElementById('edit-job-title').value.trim();
                const newClient = document.getElementById('edit-job-client').value;
                const newStatus = document.getElementById('edit-job-status').value;
                const newDueDate = document.getElementById('edit-job-due-date').value;

                if (newTitle && newClient && newStatus && newDueDate) {
                    item.title = newTitle;
                    item.client = newClient;
                    item.status = newStatus;
                    item.dueDate = newDueDate;
                    saveData();
                    renderJobs();
                    closeModal();
                } else {
                    showConfirmModal('Input Error', 'Please fill all required fields for the job.', () => {});
                }
            };
        } else if (type === 'quote') {
             item = quotes.find(q => q.id === id);
             if (!item) return;
             const clientOptions = clients.map(c => `<option value="${c.name}" ${item.client === c.name ? 'selected' : ''}>${c.name}</option>`).join('');
             formHtml = `
                 <label for="edit-quote-client" class="block text-gray-700 text-sm font-bold mb-2">Client:</label>
                 <select id="edit-quote-client" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4">
                     ${clientOptions}
                 </select>

                 <label for="edit-quote-amount" class="block text-gray-700 text-sm font-bold mb-2">Amount ($):</label>
                 <input type="number" id="edit-quote-amount" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" value="${item.amount}">

                 <label for="edit-quote-status" class="block text-gray-700 text-sm font-bold mb-2">Status:</label>
                 <select id="edit-quote-status" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4">
                     <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
                     <option value="Accepted" ${item.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                     <option value="Rejected" ${item.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                 </select>

                 <label for="edit-quote-created-date" class="block text-gray-700 text-sm font-bold mb-2">Created Date:</label>
                 <input type="date" id="edit-quote-created-date" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value="${item.createdDate}">
             `;
             saveCallback = () => {
                const newClient = document.getElementById('edit-quote-client').value;
                const newAmount = parseFloat(document.getElementById('edit-quote-amount').value);
                const newStatus = document.getElementById('edit-quote-status').value;
                const newCreatedDate = document.getElementById('edit-quote-created-date').value;

                if (newClient && !isNaN(newAmount) && newStatus && newCreatedDate) {
                    item.client = newClient;
                    item.amount = newAmount;
                    item.status = newStatus;
                    item.createdDate = newCreatedDate;
                    saveData();
                    renderQuotes();
                    closeModal();
                } else {
                     showConfirmModal('Input Error', 'Please fill all required fields for the quote.', () => {});
                }
             };
        } else if (type === 'service') {
            item = services.find(s => s.id === id);
            if (!item) return;
            formHtml = `
                <label for="edit-service-name" class="block text-gray-700 text-sm font-bold mb-2">Service Name:</label>
                <input type="text" id="edit-service-name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4" value="${item.name}">
            `;
            saveCallback = () => {
                const newName = document.getElementById('edit-service-name').value.trim();
                if (newName) {
                    item.name = newName;
                    saveData();
                    renderServices();
                    closeModal();
                } else {
                    showConfirmModal('Input Error', 'Please provide a service name.', () => {});
                }
            };
        }

        openModal(`Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`, formHtml, saveCallback);
    }

    // --- Settings Modal Functionality ---
    // Event listener for opening the settings modal
    settingsBtn.addEventListener('click', () => {
        // Populate settings fields with current userSettings
        document.getElementById('user-name-setting').value = userSettings.userName;
        document.getElementById('email-setting').value = userSettings.userEmail;
        document.getElementById('theme-setting').value = userSettings.theme;
        settingsModal.classList.remove('hidden');
    });

    // Event listener for closing the settings modal
    settingsModalCloseBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    // Event listener for closing settings modal by clicking overlay
    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    // Event listener for saving settings
    saveSettingsBtn.addEventListener('click', () => {
        userSettings.userName = document.getElementById('user-name-setting').value.trim();
        userSettings.userEmail = document.getElementById('email-setting').value.trim();
        userSettings.theme = document.getElementById('theme-setting').value;
        
        // Update header welcome message dynamically
        document.querySelector('h2.text-3xl').textContent = `Welcome back, ${userSettings.userName} 👋`;
        
        // Update profile picture placeholder text if no custom image is set
        if (userSettings.profilePicture.includes('placehold.co')) {
            profilePic.alt = userSettings.userName.charAt(0).toUpperCase();
            const spaceIndex = userSettings.userName.indexOf(' ');
            if (spaceIndex !== -1 && spaceIndex + 1 < userSettings.userName.length) {
                profilePic.alt += userSettings.userName.charAt(spaceIndex + 1).toUpperCase();
            }
            profilePic.src = `https://placehold.co/40x40/ADD8E6/000?text=${profilePic.alt}`;
        }

        saveData(); // Save updated settings to localStorage
        settingsModal.classList.add('hidden'); // Close settings modal
        showConfirmModal('Settings Saved', 'Your settings have been updated successfully!', () => {}); // Show confirmation
    });

    // --- Profile Picture Upload Functionality ---
    profilePicUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePic.src = e.target.result; // Set image source
                userSettings.profilePicture = e.target.result; // Store base64 string in settings
                saveData(); // Save updated settings
                showConfirmModal('Profile Picture Updated', 'Your profile picture has been updated!', () => {});
            };
            reader.readAsDataURL(file); // Read file as Base64 string
        }
    });

    // --- Initial Application Load ---
    // Apply user settings (profile picture and name) on initial page load
    if (userSettings.profilePicture) {
        profilePic.src = userSettings.profilePicture;
        // If the profile picture is still the default placeholder, update its text based on user name
        if (userSettings.profilePicture.includes('placehold.co')) {
             profilePic.alt = userSettings.userName.charAt(0).toUpperCase();
             const spaceIndex = userSettings.userName.indexOf(' ');
             if (spaceIndex !== -1 && spaceIndex + 1 < userSettings.userName.length) {
                 profilePic.alt += userSettings.userName.charAt(spaceIndex + 1).toUpperCase();
             }
             profilePic.src = `https://placehold.co/40x40/ADD8E6/000?text=${profilePic.alt}`;
        }
    }
    document.querySelector('h2.text-3xl').textContent = `Welcome back, ${userSettings.userName} 👋`;

    // Call updateDashboardMetrics on initial load to populate dashboard cards
    updateDashboardMetrics();
    // Determine which section to show on initial load (based on URL hash or default to 'home')
    const initialSection = window.location.hash.substring(1) || 'home';
    showSection(initialSection);
})
