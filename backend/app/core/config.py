from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "BookExchange Romania"
    VERSION: str = "2.0.0"
    DATABASE_URL: str = "postgresql://bookuser:bookpassword_localdev@localhost:5432/bookexchange_db"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
