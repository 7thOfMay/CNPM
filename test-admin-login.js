const bcrypt = require('./backend/node_modules/bcryptjs');

// Test admin password
const password = 'admin123';
const storedHash = '$2a$10$8K1p/a0dL3.I7KU.PvzP3eZ9zqGzM5vO4qJ9R1Xw9QC1qKfE8rZHm';

bcrypt.compare(password, storedHash).then(result => {
    console.log('Password match:', result);
    if (!result) {
        console.log('\nGenerating new hash for admin123...');
        bcrypt.hash(password, 10).then(newHash => {
            console.log('New hash:', newHash);
        });
    }
});
