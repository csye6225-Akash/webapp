Checks for assignement 1 :

200 OK - when we Send a GET response with no body/payload.
503: When the Database is not working.
400: When sending a GET response with payload.
405: When Response!=GET.





Students will demo the web application from their laptops. Download the zip uploaded to Canvas and use the submitted code for demo. Local code cannot be used for demo.
APIs can be demoed using any Postman or Restlet or some other REST client but not via the browser.
The application should not have UI.
Verify the success and failure by shutting down the database server while the application is still running. Restarting the database without restarting the application should work.
Verify that the only HTTP request mehod supported is GET. Making POST, PUT, DELETE, or PATCH requests should return HTTP status code 405 Method Not Allowed.
Verify that request and response have no payload requirement. The API response should NOT include a body. The request should NOT require an query parameters.
The application connects to either MySQL or PostgreSQL. No other database is allowed.
Verify code is not generat  ed by ChatGPT or Google Bard or GitHub co-pilot.
The application should not throw 500 Internal Server errors.
The application should not require a restart between API calls

Git & GitHub Repository
Git Repository Content Check (20%)
Check the repository for any IDE-specific files. IDE configuration files must not be in the repository.
Verify their .gitignore configuration.chekc
Check the repository for build artifacts such as .class, .jar, .war files and build, node_modules, venv directory. None of these should be checked into the repository.
Check for dependencies. Dependencies from the Maven repository, npm, or Python should not be committed to the git repository.
Git Forking Workflow (20%)
No direct commits are made to the organization repository. Verify that the student is working from a forked repository and using the feature branch. There should be no direct commits to their main branch in their forked repository.
command to test - npx mocha test/use.test.js



