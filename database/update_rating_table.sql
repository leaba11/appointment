-- 添加员工评分表
USE wechat_manage;

CREATE TABLE IF NOT EXISTS staff_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL COMMENT '员工ID',
    appointment_id INT NOT NULL COMMENT '预约ID',
    service_attitude INT NOT NULL COMMENT '服务态度评分(1-5)',
    technical_skill INT NOT NULL COMMENT '技术水平评分(1-5)',
    communication INT NOT NULL COMMENT '沟通能力评分(1-5)',
    total_rating DECIMAL(3,2) NOT NULL COMMENT '综合评分',
    comment TEXT DEFAULT NULL COMMENT '评价内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_appointment_rating (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工评分表';
