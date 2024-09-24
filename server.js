
const app = require('./app.js'); // Adjust the path as needed

const port = 8080;
app.listen(port, () => {
    console.log(`App listening on ${port}`);
});
