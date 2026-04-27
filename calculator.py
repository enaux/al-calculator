# Annual Leave Calculator for HSE Nurses
# -----------------------------------------------

# Standard Year: 1st April to 31st March
# Standard Week: 37.5 hours
# Bank Holiday Allowance: 10 days

# ANNUAL LEAVE ENTITLEMENT
# -----------------------------------------------
# Staff Nurses:
# - 0-5 years of service: 24 days
# - 6-10 years of service: 25 days
# - 10+ years of service: 27 days
# -----------------------------------------------
# Clinical Nurse Managers:
# - 0-5 years of service: 25 days
# - 6-10 years of service: 26 days
# - 10+ years of service: 28 days
# -----------------------------------------------

# LOGIC:
# -----------------------------------------------
# Select staff member type
# Enter start date
# Get weekly hours
# Calculate percentage of year worked
# Calculate percentage of week worked
# Calculate pro-rata annual leave entitlement
# Calculate annual leave hours
# -----------------------------------------------
# FUTURE IMPROVEMENTS:
# Get bank holiday dates
import staff_details

def calculate_al():

    title = staff_details.get_grade()
    service = staff_details.get_years()
    percentage_of_year = staff_details.calculate_days() / 365
    percentage_of_week = staff_details.get_hours() / 37.5

    if title=="CNM":
        if service=="0-5":
            leave=25
        elif service=="6-10":
            leave=26
        elif service=="10+":
            leave=28
    elif title=="SN":
        if service=="0-5":
            leave=24
        elif service=="6-10":
            leave=25
        elif service=="10+":
            leave=27

    pro_rata = leave * percentage_of_year * percentage_of_week

    leave_hours = pro_rata * 7.5

    return leave_hours


if __name__ == "__main__":
    hours = calculate_al()
    print(f"\nPro-rata annual leave entitlement: {hours:.2f} hours")