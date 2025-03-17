import React, {useState, useEffect} from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const MovieSearch = () => {
    const [movies, setMovies] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // เพิ่มสถานะการโหลด
    const apiKey = 'b7bf1e79cd28a9614e74c9ad86aa6f18';

    const fetchMovies = async () => {
        setIsLoading(true); // ตั้งค่า isLoading เป็น true ก่อนโหลดข้อมูล
        if (searchQuery) {
            try {
                const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
                    params: {
                        api_key: apiKey,
                        query: searchQuery,
                        page: currentPage,
                    },
                });
                setMovies(response.data.results.slice(0, 5));
                setTotalPages(response.data.total_pages);
            } catch (error) {
                console.error('Error fetching data: ', error);
            }
        } else {
            try {
                const response = await axios.get(`https://api.themoviedb.org/3/movie/popular`, {
                    params: {
                        api_key: apiKey,
                        page: currentPage,
                    },
                });
                setMovies(response.data.results.slice(0, 5));
                setTotalPages(response.data.total_pages);
            } catch (error) {
                console.error('Error fetching popular movies: ', error);
            }
        }
        setIsLoading(false); // ตั้งค่า isLoading เป็น false หลังจากโหลดข้อมูลเสร็จ
    };
    useEffect(() => {
        fetchMovies();
        const savedCart = JSON.parse(localStorage.getItem('cart'));
        if (savedCart) {
            setCart(savedCart);
        }
    }, [currentPage]);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = () => {
        setCurrentPage(1);
        fetchMovies();
    };

    const handlePriceChange = (e, movieId) => {
        const updatedMovies = movies.map(movie => {
            if (movie.id === movieId) {
                return {...movie, price: parseFloat(e.target.value) || 0};
            }
            return movie;
        });
        setMovies(updatedMovies);
    };

    const addToCart = (movie) => {
        const movieWithPrice = {...movie, price: movie.price || 10, quantity: 1};
        const existingMovieIndex = cart.findIndex(m => m.id === movieWithPrice.id);

        let updatedCart;

        if (existingMovieIndex !== -1) {
            updatedCart = [...cart];
            updatedCart[existingMovieIndex].quantity += 1;
        } else {
            updatedCart = [...cart, movieWithPrice];
        }

        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
    };

    const calculateDiscount = (totalPrice) => {
        const totalQuantity = cart.reduce((sum, movie) => sum + movie.quantity, 0);
        if (totalQuantity > 5) {
            return totalPrice * 0.8;
        } else if (totalQuantity > 3) {
            return totalPrice * 0.9;
        }
        return totalPrice;
    };

    const calculateTotalPrice = () => {
        const totalPrice = cart.reduce((sum, movie) => sum + (movie.price * movie.quantity), 0);
        const discountPrice = calculateDiscount(totalPrice);
        return discountPrice;
    };

    const removeFromCart = (movieId) => {
        const newCart = cart.filter(movie => movie.id !== movieId);
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('cart');
    };

    const handleCheckout = () => {

        if (calculateTotalPrice() === 0) {
            Swal.fire({
                title: 'No Items in Cart!',
                text: 'Please add items to your cart before checking out.',
                icon: 'warning',
            });
            return; // Don't proceed with checkout if the cart is empty
        }

        let timer = 60; // Initial countdown timer set to 60 seconds

        Swal.fire({
            title: 'Order Confirmation',
            html: `
            <p>Your order has been placed successfully.</p>
            <p>Payment should be made to the following account:</p>
            <p><strong>Bank Account: 123-456-789</strong></p>
            <p>Transfer within <strong id="timer">${timer}</strong> seconds!</p>
        `,
            timer: 60000, // 1 minute timer
            timerProgressBar: true,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading(); // Show loading spinner
                const timerElement = document.getElementById('timer');

                const countdown = setInterval(() => {
                    if (timer === 0) {
                        clearInterval(countdown);
                        Swal.fire({
                            title: 'Time Expired!',
                            text: 'You did not complete the payment in time.',
                            icon: 'error',
                        });
                    } else {
                        timer--;
                        if (timerElement) {
                            timerElement.textContent = timer; // Update countdown timer in the alert
                        }
                    }
                }, 1000);
            },
        });
    };

    return (
        <div className="  ">
            <div className="text-2xl font-bold mb-4 ">
                <h1 className="">Search Movies</h1>
            </div>
            <div className="mb-4 flex">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSearchSubmit();
                        }
                    }}
                    placeholder="Search for a movie"
                    className="px-4 py-2 border rounded-l-md"
                />
                <button onClick={handleSearchSubmit} className="px-4 py-2 bg-blue-500 text-white rounded-r-md">
                    Search
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center min-h-screen mt-4">
                    <div className="spinner-border animate-spin rounded-full border-4 border-t-4 border-blue-500 w-8 h-8"></div>
                </div>
            ) : (
                <div className="flex flex-col">
                    {/* table_movie*/}
                    <div className=" ">
                        <table className="w-full bg-white table-auto border-collapse mb-4">
                            <thead>
                            <tr className="bg-gray-200">
                                <th className="px-4 py-2 border">Poster</th>
                                <th className="px-4 py-2 border">Movie Title</th>
                                <th className="px-4 py-2 border">Price</th>
                                <th className="px-4 py-2 border">Add to Cart</th>
                            </tr>
                            </thead>
                            <tbody>
                            {movies.map(movie => (
                                <tr key={movie.id}>
                                    <td className="px-4 py-2 flex text-center items-center justify-center border">
                                        <img
                                            style={{width: '60px', height: '60px'}}
                                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                            alt={movie.title}
                                        />
                                    </td>
                                    <td className="px-4 py-2 border text-center truncate w-[40rem] whitespace-nowrap overflow-hidden">
                                        {movie.title}
                                    </td>
                                    <td className="px-4 py-2 border text-center">
                                        <input
                                            type="number"
                                            value={movie.price || 10}
                                            onChange={(e) => handlePriceChange(e, movie.id)}
                                            min="0"
                                            className="w-20 p-1 border rounded"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center border">
                                        <button
                                            onClick={() => addToCart(movie)}
                                            className="px-4 py-2 bg-green-500 text-white rounded"
                                        >
                                            Add to Cart
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <div className="flex items-center justify-center gap-5 mt-5 ">
                            <button
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-gray-300 rounded"
                            >
                                Previous
                            </button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-gray-300 rounded"
                            >
                                Next
                            </button>
                        </div>
                        <h2 className="text-xl font-bold mb-4">Cart</h2>
                        <ul className="mb-4">
                            {cart.map((movie, index) => (
                                <li key={index} className="mb-2 flex">
                                    <div>
                                        {index + 1}. {movie.title} - ${movie.price} (Quantity: {movie.quantity})

                                    </div>
                                    <button
                                        onClick={() => removeFromCart(movie.id)}
                                        className=" px-2 ml-2  bg-red-500 text-white rounded "
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="mb-4">
                            <span>Total before discount: ${calculateTotalPrice()}</span>
                        </div>
                        <div className="mb-4">
                            <span>Amount Discounted: ${(calculateTotalPrice() - calculateDiscount(calculateTotalPrice())).toFixed(2)}</span>
                        </div>
                        <div className="mb-4">
                            <span>Discounted Total: ${calculateDiscount(calculateTotalPrice()).toFixed(2)}</span>
                        </div>

                        <button
                            onClick={clearCart}
                            className="px-4 py-2 bg-red-500 text-white rounded mb-4"
                        >
                            Clear Cart
                        </button>

                        <button
                            onClick={handleCheckout}
                            className="px-4 py-2 ml-5 bg-blue-500 text-white rounded mb-4"
                        >
                            CheckOut
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovieSearch;

