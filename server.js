const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'visitors.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'thanh-secret-key-1001',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Đọc dữ liệu lịch sử truy cập
function getVisitors() {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

// Lưu lượt truy cập mới
app.post('/api/track', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { device, browser, screen, timezone } = req.body;
    
    // Lấy ngày giờ Việt Nam chuẩn xác
    const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    const visitors = getVisitors();
    const newVisitor = {
        id: Date.now(),
        ip: ip ? ip.replace(/^.*:/, '') : 'Ẩn danh',
        time: time,
        device: device || 'Không rõ',
        browser: browser || 'Không rõ',
        screen: screen || 'Không rõ',
        timezone: timezone || 'Không rõ'
    };

    visitors.unshift(newVisitor); // Đưa lượt mới nhất lên đầu
    if (visitors.length > 500) visitors.pop(); // Giữ tối đa 500 bản ghi
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(visitors, null, 2));
    res.json({ success: true });
});

// API Đăng nhập Host
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'thanh1' && password === 'thanh1001') {
        req.session.isAuthenticated = true;
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });
});

// Kiểm tra trạng thái đăng nhập
app.get('/api/check-auth', (req, res) => {
    if (req.session.isAuthenticated) {
        res.json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// API lấy danh sách thống kê (Chỉ khi đã đăng nhập)
app.get('/api/visitors', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(getVisitors());
});

// Đăng xuất
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});