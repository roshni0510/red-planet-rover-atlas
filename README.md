# Red Planet Rover Atlas

# MY ROLE: PERSON 5 – FRONTEND AND INTERACTIVE MAP ENGINEER

Act as my senior React developer and geospatial frontend architect.

I am responsible for creating the complete user-facing MarsWalk application.

## MY RESPONSIBILITIES

### Task 1: Create the React project

Use:

- React.

- Vite.

- Tailwind CSS.

- OpenLayers.

- JavaScript.

- Axios.

- Recharts.

- Lucide React.

Do not introduce unnecessary libraries.

### Task 2: Create the project structure

frontend/

    src/

        components/

            Sidebar.jsx

            Header.jsx

            MarsMap.jsx

            LayerPanel.jsx

            RoutePlanner.jsx

            HazardPanel.jsx

            TargetDetails.jsx

            AIChat.jsx

        pages/

            Dashboard.jsx

            Explore.jsx

            Navigation.jsx

            Science.jsx

            Reports.jsx

        services/

            api.js

        App.jsx

        main.jsx

### Task 3: Build the mission dashboard

Show:

- Mission name.

- Location.

- Expedition objective.

- Available datasets.

- Number of scientific targets.

- Current route status.

- Terrain risk indicators.

- Environmental observations.

Use actual backend data.

### Task 4: Build the interactive Mars map

Use OpenLayers.

Display:

- HiRISE imagery.

- Geological units.

- Elevation.

- Slope.

- Roughness.

- Hazards.

- Scientific targets.

- Rover observations.

- Calculated routes.

Implement:

- Zooming.

- Panning.

- Layer visibility controls.

- Legends.

- Clickable markers.

- Target information popups.

Use the correct Mars projection and coordinate transformation.

Never assume the default OpenLayers Web Mercator projection is suitable for Mars.

### Task 5: Build the route planner

Provide:

- Starting point selection.

- Destination selection.

- Route mode selection.

- Calculate route button.

- Route comparison.

Display:

- Distance.

- Terrain risk.

- Waypoints.

- Hazards.

- Scientific targets.

- Route explanation.

Get these values from Person 3's backend.

### Task 6: Build the science dashboard

Show:

- Geological targets.

- Relevant rover photographs.

- Observation details.

- Instrument names.

- Sol numbers.

- MEDA environmental charts.

- Available RIMFAX information.

### Task 7: Build the AI assistant

Create a chat interface.

Allow users to ask about:

- Geological targets.

- Route selection.

- Terrain hazards.

- Environmental measurements.

- Scientific observations.

Connect to POST /api/assistant.

Display the evidence and data limitations returned by the backend.

### Task 8: Build astronaut mode

Design a mobile-friendly navigation view.

Include:

- Simulated astronaut location.

- Next waypoint.

- Direction.

- Distance.

- Upcoming mapped hazards.

- Return route.

Do not claim live positioning or real-time suit integration.

### Task 9: Build reports page

Allow the user to generate and view expedition reports using backend results.

### Task 10: Integration and testing

Work with Person 3.

Use the agreed endpoints and JSON response formats.

Create a centralized Axios API service.

Handle:

- Loading states.

- API errors.

- Empty datasets.

- Missing images.

- Invalid responses.

- Backend unavailable scenarios.

## DESIGN DIRECTION

Use a professional planetary mission-control interface.

Visual direction:

- Dark charcoal background.

- Mars-inspired muted orange accents.

- Clear map visibility.

- Readable scientific charts.

- Minimal unnecessary animation.

- Strong visual hierarchy.

- Responsive layout.

The interface must look like a credible scientific exploration tool, not a generic AI chatbot dashboard.

## STRICT REQUIREMENTS

- Never hardcode fake route calculations.

- Never create fake scientific observations.

- Never duplicate backend logic in React.

- Do not change API contracts independently.

- Do not use arbitrary map coordinates.

- Do not break working pages when adding new components.

- Keep components modular.

## HOW I WANT YOU TO WORK

Start by creating the project structure.

Then build the dashboard.

Next develop the map and layers.

After that add route planning, science pages and the AI assistant.

Give complete working components, installation commands, exact filenames and debugging instructions.

Before changing existing files, inspect them.

My final responsibility is a fully functional and visually polished MarsWalk frontend connected to the actual backend.
never include or add datasets on your own , or never add any additional info on yourown , use only what is provided and if any particular thing you are unable to perform do not make it arbitrary, inform the place where the following task was undone and ask permission before making any changes

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://red-planet-rover-atlas.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2a11fd7e-d18d-585e-b5d7-f96dd07714ad).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
