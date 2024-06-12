import * as readline from 'readline';
import * as mysql from 'mysql';

interface Review {
    reviewID: number;
    rating: number;
    comment: string;
    reviewDate: Date;
}

const database = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bookstore'
});

database.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function executeSQL(sql: string, callback: () => void) {
    database.query(sql, (err, result) => {
        if (err) {
            console.error('Error executing SQL:', err);
            return;
        }
        console.log('SQL executed successfully');
        console.log('Result:', result);
        callback();
    });
}

function validateReview(review: Review): void {
    if (!Number.isInteger(review.reviewID) || review.reviewID <= 0) {
        throw new Error('Invalid reviewID');
    }
    if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) {
        throw new Error('Invalid rating');
    }
    if (typeof review.comment !== 'string' || review.comment.trim() === '') {
        throw new Error('Invalid comment');
    }
    if (!(review.reviewDate instanceof Date) || isNaN(review.reviewDate.getTime())) {
        throw new Error('Invalid reviewDate');
    }
}

function updateReview(review: Review, callback: () => void): void {
    try {
        validateReview(review);

        const sql = `
            UPDATE Reviews
            SET 
                Rating = ${review.rating}, 
                Comment = '${review.comment.replace(/'/g, "''")}', 
                ReviewDate = '${review.reviewDate.toISOString().split('T')[0]}'
            WHERE 
                ReviewID = ${review.reviewID};
        `;

        executeSQL(sql, callback);
        console.log('Review updated successfully');
    } catch (error) {
        console.error('Error updating review');
    }
}

function promptForReview(): void {
    rl.question('Enter rating (1-5): ', (ratingInput) => {
        const rating = parseInt(ratingInput, 10);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            console.log('Invalid rating. Rating must be a number between 1 and 5.');
            promptForReview();
            return;
        }

        rl.question('Enter comment: ', (comment) => {
            rl.question('Enter review date (YYYY-MM-DD): ', (dateInput) => {
                const reviewDate = new Date(dateInput);
                if (isNaN(reviewDate.getTime())) {
                    console.log('Invalid date format. Please enter date in YYYY-MM-DD format.');
                    promptForReview();
                    return;
                }

                const review: Review = {
                    reviewID: 1,
                    rating,
                    comment,
                    reviewDate
                };
                updateReview(review, () => {
                    rl.question('Do you want to rate again? (yes/no): ', (answer) => {
                        if (answer.toLowerCase() === 'yes') {
                            promptForReview();
                        } else {
                            rl.close();
                            console.log('Goodbye!');
                            process.exit();
                        }
                    });
                });
            });
        });
    });
}

console.log('Welcome to the review update system.');
promptForReview();