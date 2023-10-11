let products = [
    {
      "id": 1,
      "serial": "SP001",
      "brand": "SolarTech",
      "modelNumber": "ST-123",
      "capacity": "250W",
      "fulfilledStandards": ["ISO 9001", "CE", "UL"],
      "approvalNumber": "APV-SOL-456",
      "dateOfApproval": "2023-08-15",
      "type": "solar panel",
      "image": "https://www.zeronetechbd.com/uploads/product/main-image837OLWAzE7xCP1626352709.jpg",
      "price": 300
    },
    {
      "id": 2,
      "serial": "INV002",
      "brand": "PowerInnovate",
      "modelNumber": "PI-789",
      "capacity": "5KW",
      "fulfilledStandards": ["ISO 9001", "CE", "UL"],
      "approvalNumber": "APV-INV-789",
      "dateOfApproval": "2023-08-20",
      "type": "inverter",
      "image": "https://www.zeronetechbd.com/uploads/product/main-image837OLWAzE7xCP1626352709.jpg",
      "price": 500
    },
    {
      "id": 3,
      "serial": "SP002",
      "brand": "SolarWise",
      "modelNumber": "SW-200",
      "capacity": "200W",
      "fulfilledStandards": ["ISO 9001", "CE", "UL"],
      "approvalNumber": "APV-SOL-789",
      "dateOfApproval": "2023-08-10",
      "type": "solar panel",
      "image": "https://www.zeronetechbd.com/uploads/product/main-image837OLWAzE7xCP1626352709.jpg",
      "price": 250
    },
    {
      "id": 4,
      "serial": "INV003",
      "brand": "EcoPower",
      "modelNumber": "EP-1200",
      "capacity": "1.2KW",
      "fulfilledStandards": ["ISO 9001", "CE", "UL"],
      "approvalNumber": "APV-INV-123",
      "dateOfApproval": "2023-08-25",
      "type": "inverter",
      "image": "https://www.zeronetechbd.com/uploads/product/main-image837OLWAzE7xCP1626352709.jpg",
      "price": 350
    },
    {
      "id": 5,
      "serial": "SP003",
      "brand": "SolarGlide",
      "modelNumber": "SG-300",
      "capacity": "300W",
      "fulfilledStandards": ["ISO 9001", "CE", "UL"],
      "approvalNumber": "APV-SOL-987",
      "dateOfApproval": "2023-08-12",
      "type": "solar panel",
      "image": "https://www.zeronetechbd.com/uploads/product/main-image837OLWAzE7xCP1626352709.jpg",
      "price": 280
    },
    {
      "id": 6,
      "serial": "INV004",
      "brand": "EcoTech",
      "modelNumber": "ET-5000",
      "capacity": "5KW",
      "fulfilledStandards": ["ISO 9001", "CE", "UL"],
      "approvalNumber": "APV-INV-456",
      "dateOfApproval": "2023-08-28",
      "type": "inverter",
      "image": "https://www.zeronetechbd.com/uploads/product/main-image837OLWAzE7xCP1626352709.jpg",
      "price": 600
    },
    {
      "id": 7,
      "serial": "SP004",
      "brand": "SunPower",
      "modelNumber": "SP-400",
      "capacity": "400W",
      "fulfilledStandards": ["ISO 9001", "CE", "UL"],
      "approvalNumber": "APV-SOL-654",
      "dateOfApproval": "2023-08-18",
      "type": "solar panel",
      "image": "https://www.zeronetechbd.com/uploads/product/main-image837OLWAzE7xCP1626352709.jpg",
      "price": 350
    },
    {
      "id": 8,
      "serial": "INV005",
      "brand": "PowerGenius",
      "modelNumber": "PG-750",
      "capacity": "750W",
      "fulfilledStandards": ["ISO 9001", "CE", "UL"],
      "approvalNumber": "APV-INV-789",
      "dateOfApproval": "2023-08-30",
      "type": "inverter",
      "image": "https://www.zeronetechbd.com/uploads/product/main-image837OLWAzE7xCP1626352709.jpg",
      "price": 800
    },
    {
      "id": 9,
      "serial": "SP005",
      "brand": "SunTech",
      "modelNumber": "ST-350",
      "capacity": "350W",
      "fulfilledStandards": ["ISO 9001", "CE", "UL"],
      "approvalNumber": "APV-SOL-234",
      "dateOfApproval": "2023-08-22",
      "type": "solar panel",
      "image": "https://www.zeronetechbd.com/uploads/product/main-image837OLWAzE7xCP1626352709.jpg",
      "price": 300
    },
    {
      "id": 10,
      "serial": "INV006",
      "brand": "EcoPower",
      "modelNumber": "EP-2000",
      "capacity": "2KW",
      "fulfilledStandards": ["ISO 9001", "CE", "UL"],
      "approvalNumber": "APV-INV-567",
      "dateOfApproval": "2023-08-31",
      "type": "inverter",
      "image": "https://www.zeronetechbd.com/uploads/product/main-image837OLWAzE7xCP1626352709.jpg",
      "price": 450
    }
  ]
  

  for (let i = 0; i < products.length; i++) {
    // Generate a random quantity between 1 and 10 (you can adjust the range as needed)
    const randomQuantity = Math.floor(Math.random() * 10) + 1;
    products[i].quantity = randomQuantity;
  }

  console.log(products);