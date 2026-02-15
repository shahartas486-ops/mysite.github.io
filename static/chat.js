/**
 * توابع کمکی و مدیریت چت
 */

// متغیرهای چت
let isTyping = false;
let unreadMessages = 0;
let lastMessageTime = null;

/**
 * مدیریت فایل‌های آپلود شده
 */
function handleFileUpload() {
    const fileInput = document.getElementById('file-upload');
    const adminFileInput = document.getElementById('admin-file-upload');
    
    const handleFiles = (files, isAdmin = false) => {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'file-preview-container';
        previewContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 10px 0;
            padding: 15px;
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            border: 1px dashed #4361ee;
        `;
        
        Array.from(files).forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                background: rgba(26, 26, 46, 0.8);
                border-radius: 8px;
                max-width: 300px;
            `;
            
            const icon = getFileIcon(file.type);
            const fileSize = formatFileSize(file.size);
            
            fileItem.innerHTML = `
                <div style="font-size: 24px; color: #4361ee;">${icon}</div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${file.name}</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6);">${fileSize}</div>
                </div>
                <button onclick="removeFilePreview(this, ${index}, ${isAdmin})" style="
                    background: #f72585;
                    color: white;
                    border: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">&times;</button>
            `;
            
            previewContainer.appendChild(fileItem);
        });
        
        const targetContainer = isAdmin ? 
            document.getElementById('admin-messages') : 
            document.getElementById('messages');
        
        targetContainer.appendChild(previewContainer);
        
        // اسکرول به پایین
        setTimeout(() => {
            targetContainer.scrollTop = targetContainer.scrollHeight;
        }, 100);
    };
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleFiles(e.target.files, false);
            }
        });
    }
    
    if (adminFileInput) {
        adminFileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleFiles(e.target.files, true);
            }
        });
    }
    
    // پشتیبانی از Drag & Drop
    setupDragAndDrop();
}

/**
 * آیکون مناسب برای نوع فایل
 */
function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) {
        return '<i class="fas fa-image"></i>';
    } else if (fileType.startsWith('video/')) {
        return '<i class="fas fa-video"></i>';
    } else if (fileType.startsWith('audio/')) {
        return '<i class="fas fa-music"></i>';
    } else if (fileType.includes('pdf')) {
        return '<i class="fas fa-file-pdf"></i>';
    } else if (fileType.includes('text/')) {
        return '<i class="fas fa-file-alt"></i>';
    } else {
        return '<i class="fas fa-file"></i>';
    }
}

/**
 * فرمت‌بندی سایز فایل
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * حذف پیش‌نمایش فایل
 */
function removeFilePreview(button, index, isAdmin) {
    const fileInput = isAdmin ? 
        document.getElementById('admin-file-upload') : 
        document.getElementById('file-upload');
    
    const fileItem = button.closest('.file-item');
    const previewContainer = button.closest('.file-preview-container');
    
    if (fileItem) {
        fileItem.remove();
        
        // حذف فایل از input
        if (fileInput) {
            const dt = new DataTransfer();
            const files = Array.from(fileInput.files);
            files.splice(index, 1);
            
            files.forEach(file => dt.items.add(file));
            fileInput.files = dt.files;
        }
        
        // اگر همه فایل‌ها حذف شدند، حذف کانتینر
        if (previewContainer && previewContainer.children.length === 0) {
            previewContainer.remove();
        }
    }
}

/**
 * تنظیم Drag & Drop
 */
function setupDragAndDrop() {
    const messageInputs = document.querySelectorAll('.message-input, .admin-input');
    
    messageInputs.forEach(container => {
        container.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            container.style.borderColor = '#4361ee';
            container.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
        });
        
        container.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            container.style.borderColor = '';
            container.style.backgroundColor = '';
        });
        
        container.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            container.style.borderColor = '';
            container.style.backgroundColor = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const isAdmin = container.classList.contains('admin-input');
                const fileInput = isAdmin ? 
                    document.getElementById('admin-file-upload') : 
                    document.getElementById('file-upload');
                
                if (fileInput) {
                    fileInput.files = files;
                    fileInput.dispatchEvent(new Event('change'));
                    
                    // نمایش نوتیفیکیشن
                    showNotification(`فایل‌های ${files.length} مورد با موفقیت آپلود شدند`, 'success');
                }
            }
        });
    });
}

/**
 * ضبط صدا
 */
function recordAudio() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('مرورگر شما از ضبط صدا پشتیبانی نمی‌کند', 'error');
        return;
    }
    
    showAudioRecorder();
}

/**
 * نمایش رکوردر صدا
 */
function showAudioRecorder() {
    const recorderModal = document.createElement('div');
    recorderModal.id = 'audio-recorder-modal';
    recorderModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(5px);
    `;
    
    recorderModal.innerHTML = `
        <div class="recorder-content" style="
            background: rgba(26, 26, 46, 0.95);
            padding: 40px;
            border-radius: 20px;
            width: 400px;
            text-align: center;
            border: 2px solid #4361ee;
        ">
            <h3 style="color: #4361ee; margin-bottom: 20px;">
                <i class="fas fa-microphone"></i> ضبط صدا
            </h3>
            
            <div id="recorder-visualizer" style="
                width: 100%;
                height: 100px;
                background: rgba(0,0,0,0.3);
                border-radius: 10px;
                margin: 20px 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: rgba(255,255,255,0.5);
            ">
                آماده ضبط...
            </div>
            
            <div id="recorder-timer" style="
                font-size: 24px;
                font-family: monospace;
                color: #4cc9f0;
                margin: 20px 0;
            ">00:00</div>
            
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="start-recording" style="
                    background: #4cc9f0;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <i class="fas fa-circle"></i> شروع ضبط
                </button>
                
                <button id="stop-recording" style="
                    background: #f72585;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    display: none;
                ">
                    <i class="fas fa-stop"></i> توقف
                </button>
            </div>
            
            <div id="recording-status" style="margin-top: 20px; color: rgba(255,255,255,0.7);">
                حداکثر مدت ضبط: 5 دقیقه
            </div>
            
            <div style="margin-top: 30px;">
                <button onclick="closeAudioRecorder()" style="
                    background: transparent;
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 10px 25px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 14px;
                ">
                    <i class="fas fa-times"></i> بستن
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(recorderModal);
    
    // مدیریت رویدادهای ضبط
    setupAudioRecording();
}

/**
 * تنظیم ضبط صدا
 */
function setupAudioRecording() {
    let mediaRecorder = null;
    let audioChunks = [];
    let recordingTimer = null;
    let seconds = 0;
    
    const startBtn = document.getElementById('start-recording');
    const stopBtn = document.getElementById('stop-recording');
    const timerDisplay = document.getElementById('recorder-timer');
    const visualizer = document.getElementById('recorder-visualizer');
    const statusDisplay = document.getElementById('recording-status');
    
    startBtn.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // نمایش پیش‌نمایش
                showAudioPreview(audioUrl, audioBlob);
                
                // توقف استریم
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            
            // شروع تایمر
            seconds = 0;
            recordingTimer = setInterval(() => {
                seconds++;
                const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
                const secs = (seconds % 60).toString().padStart(2, '0');
                timerDisplay.textContent = `${mins}:${secs}`;
                
                // آپدیت ویژوالایزر
                updateVisualizer(visualizer, seconds);
                
                // محدودیت زمانی
                if (seconds >= 300) { // 5 دقیقه
                    stopRecording();
                }
            }, 1000);
            
            // تغییر وضعیت دکمه‌ها
            startBtn.style.display = 'none';
            stopBtn.style.display = 'flex';
            statusDisplay.textContent = 'در حال ضبط...';
            statusDisplay.style.color = '#4cc9f0';
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            showNotification('دسترسی به میکروفون ممکن نیست', 'error');
            closeAudioRecorder();
        }
    });
    
    stopBtn.addEventListener('click', () => {
        stopRecording();
    });
    
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        
        if (recordingTimer) {
            clearInterval(recordingTimer);
        }
        
        // بازنشانی تایمر
        timerDisplay.textContent = '00:00';
        statusDisplay.textContent = 'ضبط شده';
        statusDisplay.style.color = '#2ecc71';
    }
}

/**
 * آپدیت ویژوالایزر
 */
function updateVisualizer(visualizer, seconds) {
    const bars = 20;
    let visualizerHTML = '';
    
    for (let i = 0; i < bars; i++) {
        // شبیه‌سازی امواج صوتی
        const height = 20 + Math.sin((seconds * 2) + (i * 0.3)) * 15 + Math.random() * 10;
        visualizerHTML += `<div style="
            width: 8px;
            height: ${height}px;
            background: linear-gradient(to top, #4361ee, #4cc9f0);
            margin: 0 2px;
            border-radius: 4px;
            transition: height 0.1s;
        "></div>`;
    }
    
    visualizer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%;">${visualizerHTML}</div>`;
}

/**
 * نمایش پیش‌نمایش صدا
 */
function showAudioPreview(audioUrl, audioBlob) {
    const previewModal = document.createElement('div');
    previewModal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(26, 26, 46, 0.98);
        padding: 30px;
        border-radius: 20px;
        width: 400px;
        z-index: 2001;
        border: 2px solid #4cc9f0;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    `;
    
    previewModal.innerHTML = `
        <h3 style="color: #4cc9f0; margin-bottom: 20px; text-align: center;">
            <i class="fas fa-volume-up"></i> پیش‌نمایش صدا
        </h3>
        
        <audio controls style="width: 100%; margin: 20px 0;">
            <source src="${audioUrl}" type="audio/webm">
            مرورگر شما از پخش صدا پشتیبانی نمی‌کند
        </audio>
        
        <div style="margin: 20px 0; text-align: center; color: rgba(255,255,255,0.7);">
            <i class="fas fa-info-circle"></i>
            برای ارسال، روی دکمه "ارسال صوت" کلیک کنید
        </div>
        
        <div style="display: flex; gap: 15px; justify-content: center;">
            <button onclick="sendAudioMessage(${JSON.stringify(URL.createObjectURL(audioBlob))})" style="
                background: #4cc9f0;
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <i class="fas fa-paper-plane"></i> ارسال صوت
            </button>
            
            <button onclick="closeAudioPreview()" style="
                background: transparent;
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                padding: 12px 25px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 14px;
            ">
                <i class="fas fa-times"></i> حذف
            </button>
        </div>
    `;
    
    document.body.appendChild(previewModal);
}

/**
 * ارسال پیام صوتی
 */
async function sendAudioMessage(audioUrl) {
    // اینجا باید فایل صوتی به سرور ارسال شود
    // فعلاً فقط نمایش می‌دهیم
    showNotification('پیام صوتی با موفقیت ارسال شد', 'success');
    closeAudioPreview();
    closeAudioRecorder();
}

/**
 * بستن پیش‌نمایش صدا
 */
function closeAudioPreview() {
    const previewModal = document.querySelector('#audio-recorder-modal + div, [style*="position: fixed"][style*="background: rgba(26, 26, 46"]');
    if (previewModal) {
        previewModal.remove();
    }
}

/**
 * بستن رکوردر صدا
 */
function closeAudioRecorder() {
    const recorderModal = document.getElementById('audio-recorder-modal');
    if (recorderModal) {
        recorderModal.remove();
    }
}

/**
 * پاک کردن چت
 */
function clearChat() {
    if (confirm('آیا از پاک کردن تمام پیام‌های چت اطمینان دارید؟')) {
        const messagesDiv = document.getElementById('messages');
        if (messagesDiv) {
            messagesDiv.innerHTML = '';
            showNotification('چت با موفقیت پاک شد', 'success');
        }
    }
}

/**
 * کپی کردن متن
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('متن با موفقیت کپی شد', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('خطا در کپی کردن متن', 'error');
    });
}

/**
 * ایجاد پیام سیستم
 */
function createSystemMessage(content, type = 'info') {
    const messagesDiv = document.getElementById('messages');
    if (!messagesDiv) return;
    
    const systemMessage = document.createElement('div');
    systemMessage.className = 'system-message';
    systemMessage.style.cssText = `
        text-align: center;
        margin: 10px 0;
        padding: 10px;
        background: rgba(255,255,255,0.05);
        border-radius: 10px;
        color: rgba(255,255,255,0.7);
        font-size: 14px;
        border-left: 3px solid ${type === 'info' ? '#4361ee' : type === 'success' ? '#4cc9f0' : '#f72585'};
    `;
    
    systemMessage.innerHTML = `
        <i class="fas fa-${type === 'info' ? 'info-circle' : type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${content}
    `;
    
    messagesDiv.appendChild(systemMessage);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * بررسی اتصال اینترنت
 */
function checkInternetConnection() {
    if (!navigator.onLine) {
        createSystemMessage('اتصال اینترنت خود را بررسی کنید', 'error');
        return false;
    }
    return true;
}

/**
 * فرمت‌بندی تاریخ
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // کمتر از 1 دقیقه
        return 'همین الان';
    } else if (diff < 3600000) { // کمتر از 1 ساعت
        const minutes = Math.floor(diff / 60000);
        return `${minutes} دقیقه پیش`;
    } else if (diff < 86400000) { // کمتر از 1 روز
        const hours = Math.floor(diff / 3600000);
        return `${hours} ساعت پیش`;
    } else {
        return date.toLocaleDateString('fa-IR');
    }
}

/**
 * مقداردهی اولیه چت
 */
document.addEventListener('DOMContentLoaded', function() {
    // تنظیم مدیریت فایل‌ها
    handleFileUpload();
    
    // ایجاد پیام خوش‌آمدگویی
    setTimeout(() => {
        createSystemMessage('به چت هوش مصنوعی خوش آمدید! می‌توانید سوالات خود را بپرسید.', 'info');
    }, 1000);
    
    // بررسی اتصال اینترنت
    window.addEventListener('online', () => {
        createSystemMessage('اتصال اینترنت برقرار شد', 'success');
    });
    
    window.addEventListener('offline', () => {
        createSystemMessage('اتصال اینترنت قطع شده است', 'error');
    });
    
    console.log('Chat system initialized successfully');
});
