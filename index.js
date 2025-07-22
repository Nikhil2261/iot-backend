const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let deviceState = {
  light: false,
  fan: false
};

app.get('/status', (req, res) => {
  res.json(deviceState);
});

app.post('/control', (req, res) => {
  const { device, state } = req.body;
  if (deviceState.hasOwnProperty(device)) {
    deviceState[device] = state;
    res.json({ success: true, deviceState });
  } else {
    res.status(400).json({ success: false, message: 'Invalid device' });
  }
});

app.listen(PORT, () => {
  console.log(`IoT Backend running on port ${PORT}`);
});