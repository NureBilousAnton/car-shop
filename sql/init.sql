CREATE TABLE Brand (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    country_code VARCHAR(10),
    description TEXT
);

CREATE TABLE CarCentres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    description TEXT
);

CREATE TABLE Cars (
    id SERIAL PRIMARY KEY,
    brand_id INT NOT NULL REFERENCES Brand(id),
    car_centre_id INT NOT NULL REFERENCES CarCentres(id),
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    quantity INT NOT NULL CHECK (quantity >= 0),
    description TEXT
);

CREATE TABLE Orders (
    id SERIAL PRIMARY KEY,
    car_id INT NOT NULL REFERENCES Cars(id),
    check_num INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    sold_at DATE NOT NULL DEFAULT CURRENT_DATE
);

INSERT INTO Brand (name, country_code, description) VALUES
('Toyota', 'JP', 'Japanese automotive manufacturer'),
('Volkswagen', 'DE', 'German multinational automotive manufacturing company'),
('Ford', 'US', 'American multinational automaker'),
('BMW', 'DE', 'German multinational company which produces automobiles and motorcycles'),
('Mercedes-Benz', 'DE', 'German global automobile marque');

INSERT INTO CarCentres (name, address, description) VALUES
('Prestige Auto', 'Київ, вул. Центральна, 1', 'Офіційний дилер європейських брендів'),
('Global Cars', 'Львів, просп. Свободи, 25', 'Мультибрендовий автосалон'),
('Auto World', 'Одеса, вул. Морська, 15', 'Продаж нових та вживаних авто');

INSERT INTO Cars (brand_id, car_centre_id, name, price, quantity, description) VALUES
(1, 1, 'Corolla', 25000.00, 10, 'Reliable and efficient sedan'),
(2, 1, 'Golf', 28000.00, 8, 'Popular compact car'),
(4, 1, 'X5', 75000.00, 5, 'Luxury mid-size SUV'),
(1, 2, 'Camry', 30000.00, 12, 'Comfortable and spacious sedan'),
(3, 2, 'Mustang', 55000.00, 3, 'Iconic American muscle car'),
(5, 3, 'C-Class', 45000.00, 7, 'Compact executive car'),
(2, 3, 'Passat', 32000.00, 9, 'Mid-size family car'),
(4, 2, '3 Series', 48000.00, 6, 'Sporty and dynamic sedan'),
(1, 3, 'RAV4', 35000.00, 15, 'Versatile and popular SUV'),
(5, 1, 'E-Class', 65000.00, 4, 'Executive luxury sedan'),
(4, 1, 'X5', 82000.00, 2, 'Luxury mid-size SUV with M-package'),
(1, 2, 'Camry Hybrid', 32000.00, 7, 'Fuel-efficient hybrid sedan');

INSERT INTO Orders (car_id, check_num, quantity, sold_at) VALUES
(3, 1001, 1, '2025-10-22'), -- BMW X5
(5, 1002, 1, '2025-10-22'), -- Ford Mustang
(1, 1003, 2, '2025-10-23'), -- Toyota Corolla
(9, 1004, 1, '2025-10-23'), -- Toyota RAV4
(2, 1005, 1, '2025-10-24'); -- VW Golf


-- 1. Виведення інформації з таблиць. Бажано зробить виведення з пов'язаних таблиць на  одній сторінці (наприклад, докладна інформація про один з товарів без дублювання та вся інформація про його продажі).
-- 4. Оброблення виключної ситуації у застосунку, згенерованої на боці сервера бази даних у підпрограмах користувача (бажано ініціювати користувацьке виключення та обробити його в клієнтському додатку).
/* В коді застосунку */

-- 2. Виконання процедури з передачею їй параметрів із створеного додатку (наприклад, додавання інформацію в таблицю, яка виводиться).
CREATE OR REPLACE PROCEDURE add_car_sale(
    p_car_name VARCHAR,
    p_check_num INT DEFAULT NULL,
    p_quantity INT DEFAULT 1
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_car_id INT;
    v_full_car_name VARCHAR;
    v_check_num INT;
BEGIN
    SELECT id, name
    INTO v_car_id, v_full_car_name
    FROM Cars
    WHERE name ILIKE '%' || p_car_name || '%'
    ORDER BY name ASC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Не знайдено жодного автомобіля, назва котрого містить "%".', p_car_name
            USING ERRCODE = 'P0002'; -- no_data_found
    END IF;

    IF p_check_num IS NULL THEN
        SELECT COALESCE(MAX(check_num), 0) + 1 INTO v_check_num FROM Orders;
    ELSE
        v_check_num := p_check_num;
    END IF;

    INSERT INTO Orders (car_id, check_num, quantity, sold_at)
    VALUES (v_car_id, v_check_num, p_quantity, CURRENT_DATE);

    RAISE NOTICE 'Продаж успішно додано для автомобіля: "%". Номер чеку: %', v_full_car_name, v_check_num;
END;
$$;


-- 3. Виконання скалярної та табличної функцій (наприклад, підрахувати кількість товарів у заданому відділі).

CREATE OR REPLACE FUNCTION count_cars_cheaper_than_average()
RETURNS INT
BEGIN ATOMIC
    SELECT COUNT(*)::INT
    FROM Cars
    WHERE price < (SELECT AVG(price) FROM Cars);
END;

CREATE OR REPLACE FUNCTION get_cars_cheaper_than_price(
    p_price NUMERIC
)
RETURNS TABLE (
    id INT,
    name VARCHAR,
    price NUMERIC,
    description TEXT
)
BEGIN ATOMIC
    SELECT id, name, price, description
    FROM Cars
    WHERE price < p_price;
END;
