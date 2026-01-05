-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 05, 2026 at 03:53 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cafe_pos`
--

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `table_number` int(11) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `created_by` varchar(100) DEFAULT NULL,
  `code` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `total`, `created_at`, `customer_name`, `customer_phone`, `table_number`, `status`, `created_by`, `code`) VALUES
(21, 50000.00, '2025-12-20 15:04:22', 'Cường', '0123456789', 1, 'confirmed', 'admin', 'CFP625'),
(22, 15000.00, '2025-12-20 15:09:24', 'Kiên', '0123532432', 2, 'confirmed', 'admin', 'CFP486'),
(25, 75000.00, '2025-12-20 15:38:18', 'Bảo', '0123298726', 3, 'confirmed', 'admin', 'CFP485'),
(30, 300000.00, '2025-12-20 16:13:58', 'Hùng', '0122336871', 5, 'confirmed', 'admin', 'CFP784'),
(44, 60000.00, '2025-12-21 14:07:37', 'Huy', '0987162632', 10, 'confirmed', 'nhanvien', 'CFP563'),
(45, 1075000.00, '2025-12-24 03:52:13', 'Ly', '0478126382', 5, 'confirmed', 'admin', 'CFP112'),
(46, 275000.00, '2025-12-25 08:17:49', 'Vi', '0987121445', 3, 'confirmed', 'admin', 'CFP087'),
(47, 125000.00, '2025-12-25 13:58:44', 'My', '0712638469', 0, 'confirmed', 'nhanvien', 'CFP125'),
(48, 150000.00, '2025-12-25 14:00:18', 'Đức', '0816194147', 0, 'confirmed', 'nhanvien1', 'CFP651'),
(49, 475000.00, '2025-12-25 14:02:59', 'Ngọc', '0162593184', 0, 'confirmed', 'nhanvien1', 'CFP013'),
(50, 30000.00, '2025-12-25 14:06:42', 'Khang', '0124324237', 0, 'confirmed', 'nhanvien1', 'CFP152'),
(51, 30000.00, '2025-12-25 14:08:18', 'Nam', '0912343456', 0, 'confirmed', 'nhanvien', 'CFP687'),
(52, 35000.00, '2025-12-25 14:09:37', 'Vân', '0823665343', 0, 'confirmed', 'nhanvien1', 'CFP615'),
(53, 45000.00, '2025-12-25 14:10:37', 'Hiếu', '0321236546', 0, 'confirmed', 'nhanvien1', 'CFP748'),
(54, 70000.00, '2025-12-25 14:13:19', 'Lâm', '0651942985', 7, 'confirmed', 'nhanvien', 'CFP021'),
(55, 25000.00, '2025-12-26 03:14:05', 'Lan', '13232123423', 0, 'confirmed', 'nhanvien2', 'CFP181'),
(56, 70000.00, '2025-12-27 07:27:31', 'Lan', '09817254712', 0, 'confirmed', 'admin', 'CFP481'),
(57, 20000.00, '2025-12-27 07:28:54', 'g', '12312', 0, 'pending', NULL, 'CFP990'),
(58, 300000.00, '2025-12-27 07:33:54', 'qasd', '3123213213', 0, 'confirmed', 'admin', 'CFP553'),
(59, 280000.00, '2025-12-27 07:35:10', 'aksd', '0912321912', 0, 'pending', NULL, 'CFP060');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL DEFAULT 1,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `qty`, `price`) VALUES
(39, 21, 18, 2, 15000.00),
(40, 21, 11, 1, 20000.00),
(41, 22, 18, 1, 15000.00),
(46, 25, 13, 1, 35000.00),
(47, 25, 6, 1, 10000.00),
(48, 25, 16, 1, 30000.00),
(55, 30, 4, 20, 15000.00),
(73, 44, 23, 1, 45000.00),
(74, 44, 4, 1, 15000.00),
(75, 45, 24, 15, 55000.00),
(76, 45, 11, 10, 20000.00),
(77, 45, 25, 10, 5000.00),
(78, 46, 27, 5, 25000.00),
(79, 46, 16, 5, 30000.00),
(80, 47, 2, 5, 25000.00),
(81, 48, 16, 5, 30000.00),
(82, 49, 13, 5, 35000.00),
(83, 49, 25, 5, 5000.00),
(84, 49, 24, 5, 55000.00),
(85, 50, 25, 1, 5000.00),
(86, 50, 15, 1, 25000.00),
(87, 51, 15, 1, 25000.00),
(88, 51, 25, 1, 5000.00),
(89, 52, 12, 1, 25000.00),
(90, 52, 6, 1, 10000.00),
(91, 53, 17, 1, 35000.00),
(92, 53, 3, 1, 10000.00),
(93, 54, 10, 1, 25000.00),
(94, 54, 23, 1, 45000.00),
(95, 55, 10, 1, 25000.00),
(96, 56, 2, 1, 25000.00),
(97, 56, 12, 1, 25000.00),
(98, 56, 21, 2, 10000.00),
(99, 57, 11, 1, 20000.00),
(100, 58, 3, 30, 10000.00),
(101, 59, 21, 28, 10000.00);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock` int(11) NOT NULL DEFAULT 0,
  `image` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `category` varchar(100) DEFAULT NULL,
  `size` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `stock`, `image`, `description`, `created_at`, `category`, `size`) VALUES
(2, 'Cà phê sữa', 25000.00, 44, '/cafe-pos/ảnh/cafe_sua.jpg', 'Cà phê sữa sóng sánh, quyện hòa hoàn hảo giữa vị đắng đậm đà và sữa đặc béo ngậy, mang lại hương vị thơm ngon nồng nàn.', '2025-12-10 11:55:15', 'coffee', NULL),
(3, 'Bánh mì tươi', 10000.00, 40, '/cafe-pos/ảnh/banh_mi.jpg', 'Bánh mì tươi vừa ra lò nóng hổi, sở hữu lớp vỏ vàng ươm, giòn rụm tan ngay trong miệng cùng phần ruột trắng mềm, thơm phức mùi bơ sữa.', '2025-12-10 11:55:15', 'snack', NULL),
(4, 'Bạc xỉu', 15000.00, 30, '/cafe-pos/ảnh/bac_xiu.jpg', 'sự kết hợp của cà phê, sữa đặc và đá. Hương vị ngọt ngào và béo ngậy của sữa đặc hòa quyện với vị đắng đặc trưng của cà phê tạo nên một thức uống thơm ngon và hấp dẫn.', '2025-12-10 12:24:43', 'coffee', NULL),
(6, 'Bánh bơ đường', 10000.00, 30, '/cafe-pos/ảnh/banh_ngot.jpg', 'Bánh mì bơ đường vàng ruộm, giòn tan với lớp đường óng ánh quyện bơ thơm ngậy, tạo nên vị ngọt ngào đầy lôi cuốn.', '2025-12-10 12:26:54', 'cake', NULL),
(9, 'Xiên cá viên(25 miếng)', 14000.00, 25, '/cafe-pos/ảnh/vien_chien_ca.jpg', 'Cá viên chiên vàng đều, lớp vỏ dai giòn sần sật quyện cùng nước sốt cay ngọt, mang đến hương vị ăn vặt khó cưỡng.', '2025-12-19 13:31:34', 'snack', NULL),
(10, 'Cà phê đen', 25000.00, 34, '/cafe-pos/ảnh/cafe_den.jpg', 'Ly cà phê đen sóng sánh, mang hương thơm nồng nàn, vị đắng thanh nguyên bản cùng hậu vị ngọt dịu đầy tỉnh táo.', '2025-12-19 13:34:57', 'coffee', NULL),
(11, 'Cà phê muối', 20000.00, 99, '/cafe-pos/ảnh/cafe_muoi.jpg', 'Cà phê muối nồng nàn với lớp kem mặn béo ngậy, quyện cùng vị đắng đậm đà tạo nên sự cân bằng hương vị đầy lôi cuốn.', '2025-12-19 13:37:22', 'coffee', NULL),
(12, 'Trà sữa chân châu', 25000.00, 59, '/cafe-pos/ảnh/tra-sua-chan-trau.jpg', 'Trà sữa trân châu béo ngậy, dậy hương trà thơm cùng những viên trân châu đen dai giòn sần sật, tạo nên trải nghiệm ẩm thực đầy thú vị.', '2025-12-19 13:46:30', 'milktea', NULL),
(13, 'Trà sữa Thái Xanh', 35000.00, 70, '/cafe-pos/ảnh/tra-sua-thai-xanh.jpg', 'Trà sữa Thái xanh tươi mát, dậy hương trà sâm dứa nồng nàn quyện cùng sữa béo ngậy, tạo nên vị ngọt thanh đầy sảng khoái.', '2025-12-19 13:50:26', 'milktea', NULL),
(14, 'Trà sữa matcha', 35000.00, 50, '/cafe-pos/ảnh/tra-sua-matcha.jpg', 'Trà sữa matcha xanh mướt, mang vị chát nhẹ đặc trưng quyện cùng sữa béo ngậy, tạo nên hương vị thanh mát, đậm đà.', '2025-12-19 13:53:09', 'milktea', NULL),
(15, 'Hồng trà', 25000.00, 30, '/cafe-pos/ảnh/hong-tra-sui-bot.jpg', 'Hồng trà thơm nồng, nước cốt màu hổ phách, vị chát dịu cùng hậu vị ngọt thanh, mang lại cảm giác thư thái, dễ chịu.', '2025-12-19 14:30:47', 'milktea', NULL),
(16, 'Trà sữa socola', 30000.00, 65, '/cafe-pos/ảnh/tra-sua-socola.jpg', 'Trà sữa socola đậm đà, mang vị đắng nhẹ quyện cùng sữa béo ngậy, đi kèm trân chân dai giòn tạo nên sức hút khó cưỡng.', '2025-12-19 15:18:36', 'milktea', NULL),
(17, 'Trà sữa kem trứng cháy', 35000.00, 55, '/cafe-pos/ảnh/tra-sua-kem-trung-chay.jpg', 'Trà sữa kem trứng cháy béo ngậy với lớp màng kem vàng ươm, thơm mùi đường nướng, hòa quyện cùng trà sữa đậm đà đầy hấp dẫn.', '2025-12-19 16:12:53', 'milktea', NULL),
(18, 'Cà phê Fin truyền thống', 15000.00, 65, '/cafe-pos/ảnh/cafe-fin.jpg', 'Cà phê phin đậm đà, từng giọt sóng sánh mang hương thơm nồng nàn, vị đắng nguyên bản và hậu vị ngọt sâu đầy tinh tế.', '2025-12-19 16:16:06', 'coffee', NULL),
(19, 'Cà phê espresso', 45000.00, 30, '/cafe-pos/ảnh/cafe-espresso.jpg', 'cà phê đậm đặc', '2025-12-19 16:18:07', 'coffee', NULL),
(20, 'Cà phê Latte Macchiato', 65000.00, 45, '/cafe-pos/ảnh/cafe-Latte_Macchiato.jpg', 'Latte Macchiato phân lớp đẹp mắt với sữa nóng, bọt kem mịn màng hòa quyện cùng espresso đậm đà, mang vị béo ngậy và nhẹ nhàng.', '2025-12-19 17:34:32', 'coffee', NULL),
(21, 'Bánh hạnh nhân', 10000.00, 30, '/cafe-pos/ảnh/b__nh_h___nh_nh__n.jpg', 'Bánh cookies hạnh nhân giòn rụm, thơm lừng mùi bơ, hạt hạnh nhân bùi béo, mang vị ngọt dịu nhẹ đầy lôi cuốn.', '2025-12-19 17:37:58', 'cake', NULL),
(22, 'Bánh muffin nho', 23000.00, 40, '/cafe-pos/ảnh/banh-muffin-nho.jpg', 'Bánh muffin nho mềm ẩm, xốp nhẹ với những quả nho khô mọng nước, ngọt dịu điểm xuyết bên trong, tạo nên hương vị hài hòa, thơm ngon.', '2025-12-19 17:40:01', 'cake', NULL),
(23, 'Pancake', 45000.00, 40, '/cafe-pos/ảnh/pancake.jpg', 'Pancake mềm xốp, thơm lừng mùi bơ sữa, thường ăn kèm mật ong hoặc trái cây tạo nên vị ngọt ngào, hấp dẫn.', '2025-12-19 17:41:18', 'cake', NULL),
(24, 'Bánh Tiramisu', 55000.00, 95, '/cafe-pos/ảnh/Tiramisu_-_Raffaele_Diomede.jpg', 'Tiramisu mềm mịn, béo ngậy với lớp kem phô mai mascarpone hảo hạng, xen kẽ bánh sampa thấm đẫm cà phê và rượu rum, phủ bột cacao đắng nhẹ đầy quyến rũ.', '2025-12-19 17:42:44', 'cake', NULL),
(25, 'Hạt hướng dương nước dừa', 5000.00, 450, '/cafe-pos/ảnh/hat-huong-duong-xanh.jpg', 'Hạt hướng dương nước dừa giòn bùi, béo ngậy vị dừa thơm lừng, ngọt thanh, tạo nên sự kết hợp hài hòa, khó cưỡng.', '2025-12-19 17:44:37', 'snack', NULL),
(26, 'Hạt hướng dương ngũ vị hương', 6000.00, 450, '/cafe-pos/ảnh/hat-huong-duong-do.jpg', 'Hạt hướng dương ngũ vị hương giòn bùi, thấm đẫm gia vị thảo mộc nồng nàn, mang lại vị mặn ngọt hài hòa đầy lôi cuốn.', '2025-12-19 17:45:34', 'snack', NULL),
(27, 'Nem chua rán(6 miếng)', 25000.00, 60, '/cafe-pos/ảnh/nem-chua-ran.jpg', 'Nem chua rán Hà Nội giòn rụm bên ngoài, dai mềm bên trong, mang vị chua nhẹ đặc trưng quyện cùng nước chấm cay ngọt đậm đà, là món ăn vặt gây nghiện.', '2025-12-19 17:47:29', 'snack', NULL),
(28, 'Hạt dẻ cười', 16000.00, 300, '/cafe-pos/ảnh/hat-cuoi.jpg', 'Hạt dẻ cười giòn bùi, béo ngậy vị mặn nhẹ tự nhiên, là món ăn vặt thơm ngon, tốt cho sức khỏe với màu xanh đẹp mắt bên trong lớp vỏ nứt.', '2025-12-19 17:50:49', 'snack', NULL),
(29, 'Salad rau má', 36000.00, 36, '/cafe-pos/ảnh/rau-ma.jpg', 'Ngon hơn khi ăn bên đường tàu', '2025-12-19 17:52:05', 'snack', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'staff'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', '123456', 'admin'),
(2, 'nhanvien', '123456', 'staff'),
(4, 'nhanvien1', '$2y$10$i1RJFU0UJBiPYSkNwiBKmeFRCK.rDO6wv19KpYxrho3Bkj7bftL52', 'staff'),
(5, 'nhanvien2', '$2y$10$mCATFELHSS3rrHKwLLu4UuxmnfNsoht6SsE9jhPah1PUjYsVxU7LG', 'staff');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `fk_product` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
