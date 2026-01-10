-- Add departments/facilities column to hospitals
ALTER TABLE public.hospitals 
ADD COLUMN IF NOT EXISTS departments TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS facilities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bed_count INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS emergency_available BOOLEAN DEFAULT true;

-- Update existing hospitals with departments
UPDATE public.hospitals SET 
  departments = ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'Emergency', 'Laboratory', 'Radiology', 'Pharmacy', 'Blood Bank'],
  facilities = ARRAY['24/7 Emergency', 'Ambulance Service', 'Parking', 'Cafeteria', 'ATM', 'Wheelchair Access'],
  emergency_available = true
WHERE slug = 'aga-khan-university-hospital';

UPDATE public.hospitals SET 
  departments = ARRAY['OPD', 'IPD', 'ICU', 'Oncology Unit', 'Chemotherapy', 'Radiation Therapy', 'Laboratory', 'Radiology', 'Pharmacy'],
  facilities = ARRAY['24/7 Emergency', 'Ambulance Service', 'Parking', 'Cafeteria', 'Prayer Room', 'Wheelchair Access'],
  emergency_available = true
WHERE slug = 'shaukat-khanum-memorial-hospital';

UPDATE public.hospitals SET 
  departments = ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology', 'Surgery', 'Gynecology Ward'],
  facilities = ARRAY['Emergency Services', 'Ambulance', 'Parking'],
  emergency_available = true
WHERE slug = 'jinnah-hospital';

UPDATE public.hospitals SET 
  departments = ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'NICU', 'Emergency', 'Laboratory', 'Radiology', 'MRI', 'CT Scan'],
  facilities = ARRAY['24/7 Emergency', 'Ambulance Service', 'Parking', 'Cafeteria', 'Blood Bank'],
  emergency_available = true
WHERE slug = 'pims-islamabad';

UPDATE public.hospitals SET 
  departments = ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'Emergency', 'Laboratory', 'Radiology', 'Dialysis', 'Pharmacy'],
  facilities = ARRAY['24/7 Emergency', 'Ambulance Service', 'Parking', 'Cafeteria', 'ATM'],
  emergency_available = true
WHERE slug = 'liaquat-national-hospital';

UPDATE public.hospitals SET 
  departments = ARRAY['OPD', 'IPD', 'ICU', 'NICU', 'Emergency', 'Laboratory', 'Radiology', 'Dialysis', 'Oncology'],
  facilities = ARRAY['Free Treatment', '24/7 Emergency', 'Ambulance Service', 'Wheelchair Access'],
  emergency_available = true
WHERE slug = 'indus-hospital';

-- Add more hospitals for different cities
INSERT INTO public.hospitals (name, slug, city, address, specialties, departments, facilities, contact_phone, description, rating, review_count, emergency_available) VALUES
-- Lahore Hospitals
('Services Hospital Lahore', 'services-hospital-lahore', 'Lahore', 'Jail Road, Lahore', ARRAY['General Medicine', 'Surgery', 'Cardiology', 'Orthopedics', 'Gynecology'], ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'Emergency', 'Laboratory', 'Radiology', 'Blood Bank'], ARRAY['24/7 Emergency', 'Ambulance', 'Parking'], '042-99200601', 'One of the largest government hospitals in Punjab.', 4.1, 650, true),
('Doctors Hospital Lahore', 'doctors-hospital-lahore', 'Lahore', 'Canal Bank, Lahore', ARRAY['Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 'Pediatrics'], ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'NICU', 'Emergency', 'Laboratory', 'Radiology', 'MRI', 'CT Scan'], ARRAY['24/7 Emergency', 'Ambulance', 'Valet Parking', 'Cafeteria', 'ATM'], '042-35302701', 'A leading private healthcare facility with state-of-the-art equipment.', 4.7, 1100, true),
('Hameed Latif Hospital', 'hameed-latif-hospital', 'Lahore', 'Canal Bank Road, Lahore', ARRAY['Cardiology', 'Gastroenterology', 'Urology', 'ENT', 'Dermatology'], ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology', 'Pharmacy'], ARRAY['24/7 Emergency', 'Ambulance', 'Parking', 'Cafeteria'], '042-35761999', 'Renowned hospital known for quality healthcare services.', 4.5, 890, true),
('Mayo Hospital Lahore', 'mayo-hospital-lahore', 'Lahore', 'Neela Gumbad, Lahore', ARRAY['General Medicine', 'Surgery', 'Orthopedics', 'Gynecology', 'Pediatrics'], ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology', 'Blood Bank'], ARRAY['Emergency Services', 'Ambulance', 'Parking'], '042-99211100', 'Historic teaching hospital attached to King Edward Medical University.', 4.0, 720, true),

-- Karachi Hospitals  
('Ziauddin Hospital', 'ziauddin-hospital', 'Karachi', 'Clifton, Karachi', ARRAY['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Nephrology'], ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'NICU', 'Emergency', 'Laboratory', 'Radiology', 'Dialysis'], ARRAY['24/7 Emergency', 'Ambulance', 'Parking', 'Cafeteria', 'ATM'], '021-35862937', 'Multi-campus hospital network providing comprehensive healthcare.', 4.4, 920, true),
('South City Hospital', 'south-city-hospital', 'Karachi', 'Clifton, Karachi', ARRAY['Cardiology', 'Gastroenterology', 'Orthopedics', 'Gynecology', 'Pediatrics'], ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'Emergency', 'Laboratory', 'Radiology', 'Pharmacy'], ARRAY['24/7 Emergency', 'Ambulance', 'Valet Parking', 'Cafeteria'], '021-35292020', 'Modern healthcare facility in the heart of Clifton.', 4.6, 780, true),
('Patel Hospital', 'patel-hospital', 'Karachi', 'Gulshan-e-Iqbal, Karachi', ARRAY['General Medicine', 'Surgery', 'Cardiology', 'Gynecology', 'Pediatrics'], ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology', 'Pharmacy'], ARRAY['24/7 Emergency', 'Ambulance', 'Parking'], '021-34821021', 'Trusted healthcare provider serving the community.', 4.3, 650, true),
('Jinnah Postgraduate Medical Centre', 'jpmc-karachi', 'Karachi', 'Rafiqui Shaheed Road, Karachi', ARRAY['General Medicine', 'Surgery', 'Cardiology', 'Neurology', 'Nephrology'], ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'Emergency', 'Laboratory', 'Radiology', 'Blood Bank', 'Dialysis'], ARRAY['Emergency Services', 'Ambulance', 'Parking'], '021-99201300', 'Premier government hospital and medical research center.', 4.2, 1050, true),

-- Islamabad Hospitals
('Shifa International Hospital', 'shifa-international-hospital', 'Islamabad', 'H-8/4, Islamabad', ARRAY['Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 'Transplant'], ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'NICU', 'Emergency', 'Laboratory', 'Radiology', 'MRI', 'CT Scan', 'Dialysis'], ARRAY['24/7 Emergency', 'Ambulance', 'Valet Parking', 'Cafeteria', 'ATM', 'Pharmacy'], '051-8463000', 'Leading tertiary care hospital with international standards.', 4.8, 1450, true),
('Maroof International Hospital', 'maroof-international-hospital', 'Islamabad', 'F-10, Islamabad', ARRAY['Cardiology', 'Gastroenterology', 'Orthopedics', 'ENT', 'Dermatology'], ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology', 'Pharmacy'], ARRAY['24/7 Emergency', 'Ambulance', 'Parking', 'Cafeteria'], '051-2618371', 'Quality healthcare with personalized patient care.', 4.5, 680, true),
('Quaid-e-Azam International Hospital', 'quaid-e-azam-hospital', 'Islamabad', 'E-11, Islamabad', ARRAY['Cardiology', 'Neurology', 'Orthopedics', 'Urology', 'Oncology'], ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'Emergency', 'Laboratory', 'Radiology', 'MRI'], ARRAY['24/7 Emergency', 'Ambulance', 'Parking', 'Cafeteria', 'ATM'], '051-8449100', 'Modern healthcare facility with advanced diagnostic services.', 4.6, 820, true),

-- Rawalpindi Hospitals
('Holy Family Hospital', 'holy-family-hospital', 'Rawalpindi', 'Satellite Town, Rawalpindi', ARRAY['General Medicine', 'Surgery', 'Cardiology', 'Gynecology', 'Pediatrics'], ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology', 'Blood Bank'], ARRAY['Emergency Services', 'Ambulance', 'Parking'], '051-9290301', 'Major teaching hospital attached to Rawalpindi Medical University.', 4.1, 580, true),
('Benazir Bhutto Hospital', 'benazir-bhutto-hospital', 'Rawalpindi', 'Murree Road, Rawalpindi', ARRAY['General Medicine', 'Surgery', 'Orthopedics', 'Gynecology', 'ENT'], ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology'], ARRAY['Emergency Services', 'Ambulance', 'Parking'], '051-9290501', 'Government hospital providing affordable healthcare.', 4.0, 520, true),
('Fauji Foundation Hospital', 'fauji-foundation-hospital', 'Rawalpindi', 'The Mall, Rawalpindi', ARRAY['Cardiology', 'Orthopedics', 'Urology', 'Gastroenterology', 'Nephrology'], ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'Emergency', 'Laboratory', 'Radiology', 'Dialysis'], ARRAY['24/7 Emergency', 'Ambulance', 'Parking', 'Cafeteria'], '051-9272464', 'Well-equipped hospital serving military and civilian patients.', 4.4, 720, true),

-- Faisalabad Hospitals
('Allied Hospital Faisalabad', 'allied-hospital-faisalabad', 'Faisalabad', 'Abdullahpur, Faisalabad', ARRAY['General Medicine', 'Surgery', 'Cardiology', 'Gynecology', 'Pediatrics'], ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology', 'Blood Bank'], ARRAY['Emergency Services', 'Ambulance', 'Parking'], '041-9210183', 'Major teaching hospital in Faisalabad.', 4.0, 450, true),
('Faisalabad Institute of Cardiology', 'faisalabad-cardiology', 'Faisalabad', 'Sargodha Road, Faisalabad', ARRAY['Cardiology', 'Cardiac Surgery', 'Interventional Cardiology'], ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'Cath Lab', 'Emergency', 'Laboratory', 'Radiology'], ARRAY['24/7 Emergency', 'Ambulance', 'Parking'], '041-9200285', 'Specialized cardiac care center.', 4.5, 380, true),

-- Multan Hospitals
('Nishtar Hospital Multan', 'nishtar-hospital-multan', 'Multan', 'Nishtar Road, Multan', ARRAY['General Medicine', 'Surgery', 'Cardiology', 'Orthopedics', 'Gynecology'], ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology', 'Blood Bank'], ARRAY['Emergency Services', 'Ambulance', 'Parking'], '061-9200267', 'Largest public sector hospital in South Punjab.', 4.1, 620, true),
('Multan Institute of Cardiology', 'multan-cardiology', 'Multan', 'Nishtar Road, Multan', ARRAY['Cardiology', 'Cardiac Surgery', 'Interventional Cardiology'], ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'Cath Lab', 'Emergency', 'Laboratory'], ARRAY['24/7 Emergency', 'Ambulance', 'Parking'], '061-9200789', 'Premier cardiac care facility in Multan.', 4.4, 340, true),

-- Peshawar Hospitals
('Lady Reading Hospital', 'lady-reading-hospital', 'Peshawar', 'Hospital Road, Peshawar', ARRAY['General Medicine', 'Surgery', 'Cardiology', 'Gynecology', 'Pediatrics'], ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology', 'Blood Bank'], ARRAY['Emergency Services', 'Ambulance', 'Parking'], '091-9211430', 'Major government hospital in KPK.', 4.0, 580, true),
('Hayatabad Medical Complex', 'hayatabad-medical-complex', 'Peshawar', 'Hayatabad, Peshawar', ARRAY['Cardiology', 'Nephrology', 'Neurology', 'Oncology', 'Orthopedics'], ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'NICU', 'Emergency', 'Laboratory', 'Radiology', 'Dialysis'], ARRAY['24/7 Emergency', 'Ambulance', 'Parking', 'Blood Bank'], '091-9217140', 'Modern teaching hospital with specialized departments.', 4.3, 720, true),
('Northwest General Hospital', 'northwest-general-hospital', 'Peshawar', 'Phase 5, Hayatabad, Peshawar', ARRAY['Cardiology', 'Neurology', 'Orthopedics', 'Urology', 'Oncology'], ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'Emergency', 'Laboratory', 'Radiology', 'MRI', 'CT Scan'], ARRAY['24/7 Emergency', 'Ambulance', 'Valet Parking', 'Cafeteria', 'ATM'], '091-5822591', 'Leading private hospital in Peshawar.', 4.6, 650, true),

-- Gujranwala Hospitals
('DHQ Hospital Gujranwala', 'dhq-hospital-gujranwala', 'Gujranwala', 'GT Road, Gujranwala', ARRAY['General Medicine', 'Surgery', 'Gynecology', 'Pediatrics', 'Orthopedics'], ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology'], ARRAY['Emergency Services', 'Ambulance', 'Parking'], '055-9200301', 'Main government hospital serving Gujranwala district.', 3.9, 320, true),

-- Sialkot Hospitals
('Allama Iqbal Memorial Hospital', 'allama-iqbal-hospital-sialkot', 'Sialkot', 'Paris Road, Sialkot', ARRAY['General Medicine', 'Surgery', 'Cardiology', 'Gynecology', 'Pediatrics'], ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology'], ARRAY['Emergency Services', 'Ambulance', 'Parking'], '052-4260601', 'Major hospital serving Sialkot city.', 4.0, 280, true),

-- Sargodha Hospitals
('DHQ Hospital Sargodha', 'dhq-hospital-sargodha', 'Sargodha', 'University Road, Sargodha', ARRAY['General Medicine', 'Surgery', 'Gynecology', 'Pediatrics', 'Orthopedics'], ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology'], ARRAY['Emergency Services', 'Ambulance', 'Parking'], '048-9230301', 'Main government hospital in Sargodha.', 3.8, 240, true),

-- Quetta Hospitals
('Bolan Medical Complex', 'bolan-medical-complex', 'Quetta', 'Brewery Road, Quetta', ARRAY['General Medicine', 'Surgery', 'Cardiology', 'Gynecology', 'Pediatrics'], ARRAY['OPD', 'IPD', 'ICU', 'Emergency', 'Laboratory', 'Radiology', 'Blood Bank'], ARRAY['Emergency Services', 'Ambulance', 'Parking'], '081-9211234', 'Major medical facility in Balochistan.', 4.0, 380, true),
('CMH Quetta', 'cmh-quetta', 'Quetta', 'Quetta Cantonment', ARRAY['General Medicine', 'Surgery', 'Cardiology', 'Orthopedics', 'Neurology'], ARRAY['OPD', 'IPD', 'ICU', 'CCU', 'Emergency', 'Laboratory', 'Radiology', 'Pharmacy'], ARRAY['24/7 Emergency', 'Ambulance', 'Parking'], '081-9201234', 'Military hospital with advanced facilities.', 4.3, 420, true);