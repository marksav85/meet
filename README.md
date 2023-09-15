# Meet App

[Check of the app here: ](https://marksav85.github.io/meet/)

## Key Features:
- Filter Events by City.
- Show/Hide Event Details.
- Specify Number of Events.
- Use the App When Offline.
- Add an App Shortcut to the Home Screen.
- Display Charts Visualizing Event Details.

## What do I want to do and what should happen?

#### I would like to be able to filter events by city so that I can see the list of events that take place in that city:
- *Given* user is searching for events by city, *when* the user inputs and selects a city from the list, *then* their city should be changed to that city AND the user should receive a list of upcoming events in that city.

#### I would like to be able to show/hide event details so that I can see more/less information about an event:
- *Given* user has found an event, *when* the user toggles the event, *then* the user should see more/less information about that event.

#### I would like to be able to specify the number of events I want to view in the app so that I can see more or fewer events in the events list at once:
- *Given* user is in the correct settings view, *when* the user increases/decreases the default setting, *then* the user should see more/fewer events in the events list.

#### I would like to be able to use the app when offline so that I can see the events I viewed the last time I was online:
- *Given* user is offline, *when* the user opens the app, *then* the user should see the events they viewed last time they were online.

#### I would like to be able to add the app shortcut to my home screen so that I can open the app faster:
- *Given* user is able to access the app via the device browser AND the device enables the user to save shortcuts, *when* the user adds the app shortcut to their devices homescreen AND clicks on the shortcut, *then* the app will automatically open in the desired browser.

#### I would like to be able to see a chart showing the upcoming events in each city so that I know what events are organized in which city:
- *Given* user is searching for events AND has filtered the search by a specific city, *when* the user clicks on the city, *then* the app will display a chart of all upcoming events in that city.

## Technical Information:
- The app will be a React application.
- The app will be built using the TDD technique.
- The app will use the Google Calendar API and OAuth2 authentication flow.
- The app will use serverless functions (AWS lambda is preferred) for the authorization server
instead of using a traditional server.
- The app’s code will be hosted in a Git repository on GitHub.
- The app will work on the latest versions of Chrome, Firefox, Safari, Edge, and Opera, as well
as on IE11.
- The app will display well on all screen sizes (including mobile and tablet) widths of 1920px
and 320px.
- The app will pass Lighthouse’s PWA checklist.
- The app will work offline or in slow network conditions with the help of a service worker.
- Users may be able to install the app on desktop and add the app to their home screen on
mobile.
- The app will be deployed on GitHub Pages.
- The app will implement an alert system using an OOP approach to show information to the
user.
- The app will make use of data visualization.
- The app will be covered by tests with a coverage rate >= 90%.
- The app will be monitored using an online performance monitoring tool.

## How serverless functions will be used in this app

Serverless functions will be used as it requires no backend maintenance, easy to scale, always available and no cost for idle time. This will allow for instant loading, offline support, push notifications, “add to home screen” prompt,
responsive design, and cross-platform compatibility.