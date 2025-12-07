-- Insert default QP MEMBER customer if not exists
INSERT INTO customers (id, name, email, points, unlimited, created_at)
VALUES ('qp-member', 'QP MEMBER', 'qp@member.com', 999999, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert default products if not exists
INSERT INTO products (id, name, description, price, image, stock, category, created_at)
VALUES 
  ('1', 'QP T-Shirt', 'Official Qurtubiks Protesters t-shirt', 25.00, '/placeholder.svg?height=400&width=400', 50, 'Apparel', NOW()),
  ('2', 'QP Hoodie', 'Comfortable QP hoodie', 45.00, '/placeholder.svg?height=400&width=400', 30, 'Apparel', NOW()),
  ('3', 'QP Cap', 'Stylish QP baseball cap', 15.00, '/placeholder.svg?height=400&width=400', 100, 'Accessories', NOW()),
  ('4', 'QP Sticker Pack', 'Set of 10 QP stickers', 5.00, '/placeholder.svg?height=400&width=400', 200, 'Accessories', NOW()),
  ('5', 'QP Poster', 'Large QP protest poster', 10.00, '/placeholder.svg?height=400&width=400', 75, 'Accessories', NOW())
ON CONFLICT (id) DO NOTHING;
