import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway05.us-east-1.prod.aws.tidbcloud.co',
  user: 'root',
  password: process.env.TIDB_PASSWORD,
  database: 'les-batisseurs-engages-app-v5',
  port: 4000
});

const sql = `
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('active','pending','completed','archived') DEFAULT 'active',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  budget DECIMAL(12,2),
  spent DECIMAL(12,2) DEFAULT 0,
  startDate DATETIME,
  endDate DATETIME,
  leaderId INT,
  teamMembers JSON,
  progress INT DEFAULT 0,
  createdBy INT,
  updatedBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  isArchived BOOLEAN DEFAULT FALSE,
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_leaderId (leaderId),
  INDEX idx_createdAt (createdAt)
);

CREATE TABLE IF NOT EXISTS project_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('pending','in-progress','completed') DEFAULT 'pending',
  priority ENUM('low','medium','high') DEFAULT 'medium',
  assignedTo INT,
  dueDate DATETIME,
  completedAt DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_projectId (projectId),
  INDEX idx_status (status),
  INDEX idx_assignedTo (assignedTo)
);

CREATE TABLE IF NOT EXISTS project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  memberId INT NOT NULL,
  role VARCHAR(100),
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_member (projectId, memberId),
  INDEX idx_projectId (projectId),
  INDEX idx_memberId (memberId)
);
`;

try {
  const statements = sql.split(';').filter(s => s.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      await connection.execute(statement);
      console.log('✓ Executed:', statement.substring(0, 50) + '...');
    }
  }
  console.log('✓ All migrations completed successfully');
} catch (error) {
  console.error('✗ Migration error:', error.message);
} finally {
  await connection.end();
}
