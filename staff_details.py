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

import os
import requests
from dotenv import load_dotenv


load_dotenv()


def get_grade():
    not_answered = True
    while not_answered:
        print("Select grade: ")
        print("1 = Clinical Nurse Manager")
        print("2 = Staff Nurse")
        grade = int(input("Enter number:\t"))
        if grade==1 or grade==2:
            not_answered = False
    if (grade==1):
        return "CNM"
    elif (grade==2):
        return "SN"
    
def get_years():
    not_answered = True
    while not_answered:
        print("Select years of service: ")
        print("1 = 0-5 years")
        print("2 = 6-10 years")
        print("3 = 10+ years")
        years = int(input("Enter number:\t"))
        if years==1 or years ==2 or years==3:
            not_answered = False
    if (years==1):
        return "0-5"
    elif (years==2):
        return "6-10"
    elif (years==3):
        return "10+"
    
def get_hours():
    not_answered = True
    while not_answered:
        hours = int(input("Enter weekly hours:\t"))
        print(f"You have entered: {hours} hours")
        confirm = input("Is this correct? Enter y/n:\t")
        if confirm == "y":
            not_answered = False
    return hours

def start_day():
    not_answered = True
    while not_answered:
        day = input("Enter start day:\t")
        print(f"You have entered: {day}")
        confirm = input("Is this correct? Enter y/n:\t")
        if confirm == "y":
            not_answered = False
    return day

def start_month():
    not_answered = True
    while not_answered:
        month = input("Enter start month, e.g. for August enter 8, for October enter 10:\t")
        print(f"You have entered: {month}")
        confirm = input("Is this correct? Enter y/n:\t")
        if confirm == "y":
            not_answered = False
    return month

def start_year():
    not_answered = True
    while not_answered:
        year = int(input("Enter start year:\t"))
        print(f"You have entered: {year}")
        confirm = input("Is this correct? Enter y/n:\t")
        if confirm == "y":
            not_answered = False
    return year

def calculate_days():
    day = start_day().zfill(2)
    month = start_month().zfill(2)
    year = str(start_year())

    date1 = f"{year}-{month}-{day}"
    date2 = "2027-04-01"

    api_key = os.environ.get("TINYFN_API_KEY", "")
    if not api_key:
        raise ValueError("TINYFN_API_KEY environment variable is not set.")

    response = requests.get(
        'https://api.tinyfn.io/v1/datetime/diff',
        params={'date1': date1, 'date2': date2},
        headers={'X-API-Key': api_key}
    )
    response.raise_for_status()
    result = response.json()
    days = result['difference']['days']
    return days
