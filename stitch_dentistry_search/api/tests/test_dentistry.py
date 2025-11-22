def test_seeded_dentistry_profile(client):
    response = client.get("/dentistries")
    assert response.status_code == 200
    dentistries = response.json()
    assert dentistries
    names = {dentistry["name"] for dentistry in dentistries}
    assert "Bright Smiles Dental" in names
